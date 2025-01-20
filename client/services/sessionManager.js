import { voiceService } from "./voiceService";

class SessionManager {
  constructor() {
    this.isSessionActive = false;
    this.idleCheckInterval = null;
    this.IDLE_TIMEOUT = 30000; // 30 seconds
    // Initialize speechSynthesis only if window exists (client-side)
    this.speechSynthesis =
      typeof window !== "undefined" ? window.speechSynthesis : null;
  }

  async startSession() {
    if (this.isSessionActive) return;

    try {
      // Play welcome message
      await this.playAudioResponse("Hey Woiferl, wie kann ich dir helfen?");

      this.isSessionActive = true;
      this.startIdleCheck();

      // Start your existing OpenAI session here
      // ... your existing session start code ...
    } catch (error) {
      console.error("Failed to start session:", error);
      this.endSession();
    }
  }

  async endSession(isTimeout = false) {
    if (!this.isSessionActive) return;

    try {
      // Play goodbye message
      await this.playAudioResponse("Bis später Woiferl");

      this.isSessionActive = false;
      this.stopIdleCheck();

      // End your existing OpenAI session here
      // ... your existing session end code ...
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }

  startIdleCheck() {
    this.idleCheckInterval = setInterval(() => {
      const idleTime = voiceService.getTimeSinceLastAudio();
      if (idleTime >= this.IDLE_TIMEOUT) {
        this.endSession(true);
      }
    }, 1000); // Check every second
  }

  stopIdleCheck() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  async playAudioResponse(text) {
    // Only play audio if we're on the client side
    if (this.speechSynthesis) {
      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "de-DE";
        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);
        this.speechSynthesis.speak(utterance);
      });
    }
    // If we're on the server side, just resolve immediately
    return Promise.resolve();
  }
}

export const sessionManager = new SessionManager();
