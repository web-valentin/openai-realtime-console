import { PorcupineWorker } from "@picovoice/porcupine-web";
import { WebVoiceProcessor } from "@picovoice/web-voice-processor";

class VoiceService {
  constructor() {
    this.porcupine = null;
    this.isListening = false;
    this.onWakeWord = null;
    this.onStopCommand = null;
    this.onIdleTimeout = null;
    this.audioContext = null;
    this.idleTimer = null;
    this.IDLE_TIMEOUT = 30000;
  }

  async initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // If context is in suspended state, try to resume it
      if (this.audioContext.state === "suspended") {
        try {
          await this.audioContext.resume();
        } catch (error) {
          console.warn("Could not resume AudioContext:", error);
        }
      }
    }
    return this.audioContext;
  }

  async playAudioResponse() {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: "Hey Woiferl, wie kann ich helfen?",
          voice: "onyx",
          model: "tts-1",
        }),
      });

      const arrayBuffer = await response.arrayBuffer();

      // Initialize or resume AudioContext
      const context = await this.initializeAudioContext();

      // If context is still suspended, skip audio playback but continue with wake word
      if (context.state === "suspended") {
        console.warn("AudioContext is suspended, skipping audio feedback");
        return Promise.resolve();
      }

      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);

      return new Promise((resolve) => {
        source.onended = resolve;
        source.start(0);
      });
    } catch (error) {
      console.error("Failed to play audio response:", error);
      return Promise.resolve(); // Continue even if audio fails
    }
  }

  async initialize(apiKey) {
    try {
      // Initialize AudioContext early with a user gesture
      if (typeof window !== "undefined") {
        await this.initializeAudioContext();
      }

      function keywordDetectionCallback(detection) {
        console.log(`Porcupine detected: ${detection.label}`);
        if (detection.label === "hey_kiwi") {
          // Temporarily stop wake word detection
          WebVoiceProcessor.unsubscribe(this.porcupine);

          // Play audio response and then trigger wake word
          this.playAudioResponse().then(() => {
            WebVoiceProcessor.subscribe(this.porcupine);
            this.onWakeWord && this.onWakeWord();
          });
        } else if (detection.label === "kiwi_stop") {
          // Temporarily stop wake word detection
          WebVoiceProcessor.unsubscribe(this.porcupine);

          // First stop the session, then play goodbye
          this.onStopCommand && this.onStopCommand();

          // Play goodbye after session is stopped
          this.playGoodbyeResponse().then(() => {
            WebVoiceProcessor.subscribe(this.porcupine);
          });
        }
      }

      // Create Porcupine instance with both keywords
      this.porcupine = await PorcupineWorker.create(
        apiKey,
        [
          {
            label: "hey_kiwi",
            publicPath: "/assets/keywords/Hey-Kiwi_de_wasm_v3_0_0.ppn",
          },
          {
            label: "kiwi_stop",
            publicPath: "/assets/keywords/Kiwi-Stop_de_wasm_v3_0_0.ppn",
          },
        ],
        keywordDetectionCallback.bind(this),
        {
          publicPath: "/assets/models/porcupine_params_de.pv",
        },
      );

      // Subscribe to voice processor
      await WebVoiceProcessor.subscribe(this.porcupine);
      console.log("Wake word detection initialized successfully");
      this.isListening = true;
    } catch (error) {
      console.error("Failed to initialize wake word detection:", error);
      throw error;
    }
  }

  async playGoodbyeResponse() {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: "Auf Wiedersehen, bis zum nächsten Mal!",
          voice: "onyx",
          model: "tts-1",
        }),
      });

      const arrayBuffer = await response.arrayBuffer();
      const context = await this.initializeAudioContext();

      if (context.state === "suspended") {
        console.warn("AudioContext is suspended, skipping audio feedback");
        return Promise.resolve();
      }

      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);

      return new Promise((resolve) => {
        source.onended = resolve;
        source.start(0);
      });
    } catch (error) {
      console.error("Failed to play goodbye response:", error);
      return Promise.resolve();
    }
  }

  startIdleTimer() {
    console.log("Starting idle timer (10 seconds)");
    this.clearIdleTimer();

    this.idleTimer = setTimeout(() => {
      console.log("Idle timeout triggered - no activity for 10 seconds");
      if (this.onIdleTimeout) {
        // First stop the session
        console.log("Executing idle timeout callback");
        this.onIdleTimeout();

        // Then play goodbye
        console.log("Playing goodbye message due to idle timeout");
        this.playGoodbyeResponse().then(() => {
          console.log(
            "Resubscribing to wake word detection after idle timeout",
          );
          WebVoiceProcessor.subscribe(this.porcupine);
        });
      }
    }, this.IDLE_TIMEOUT);
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      console.log("Clearing existing idle timer");
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  resetIdleTimer() {
    console.log("Resetting idle timer due to activity");
    this.startIdleTimer();
  }

  startListening(onWakeWord, onStopCommand, onIdleTimeout) {
    console.log("Starting listening with all callbacks");
    this.onWakeWord = onWakeWord;
    this.onStopCommand = onStopCommand;
    this.onIdleTimeout = onIdleTimeout;
  }

  stopListening() {
    console.log("Stopping listening and clearing all callbacks");
    if (!this.isListening) return;
    this.onWakeWord = null;
    this.onStopCommand = null;
    this.onIdleTimeout = null;
    this.clearIdleTimer();
  }

  async cleanup() {
    console.log("Cleaning up voice service");
    this.stopListening();
    if (this.porcupine) {
      await WebVoiceProcessor.unsubscribe(this.porcupine);
      this.porcupine.release();
      this.porcupine.terminate();
      this.porcupine = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Only create the service instance on the client side
const voiceService = typeof window !== "undefined" ? new VoiceService() : null;

export { voiceService };
