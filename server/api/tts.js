import OpenAI from "openai";

const openai = new OpenAI();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { input, voice, model } = req.body;

    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: input,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    console.error("TTS API error:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
}
