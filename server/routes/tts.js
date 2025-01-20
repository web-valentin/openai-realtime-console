import OpenAI from "openai";

export default async function ttsRoutes(fastify) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  fastify.post("/api/tts", async (request, reply) => {
    try {
      const { input, voice, model } = request.body;

      const mp3 = await openai.audio.speech.create({
        model: model,
        voice: voice,
        input: input,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      reply.header("Content-Type", "audio/mpeg").send(buffer);
    } catch (error) {
      console.error("TTS API error:", error);
      reply.status(500).send({ error: "Failed to generate speech" });
    }
  });
}
