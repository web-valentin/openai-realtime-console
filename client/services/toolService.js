// Tool definitions and handlers for OpenAI function calling
export const tools = [
  {
    type: "function",
    name: "get_weather",
    description: "Gibt das aktuelle Wetter für einen bestimmten Ort zurück.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description:
            "Der Ort für den das Wetter abgefragt werden soll (z.B. Vienna, Berlin, etc.)",
        },
      },
      required: ["location"],
    },
  },
  {
    type: "function",
    name: "get_time",
    description: "Gibt die aktuelle Uhrzeit für eine Zeitzone zurück.",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Die Zeitzone (z.B. Europe/Vienna)",
          default: "Europe/Vienna",
        },
      },
    },
  },
];

// Tool Handler Implementierungen
export const toolHandlers = {
  get_weather: async ({ location }) => {
    try {
      // Hier würden wir die Weather API aufrufen
      // Beispiel-Response für jetzt:
      return JSON.stringify({
        temperature: 22,
        condition: "sonnig",
        location: location,
      });
    } catch (error) {
      console.error("Fehler beim Wetter-API Aufruf:", error);
      throw error;
    }
  },

  get_time: async ({ timezone = "Europe/Vienna" }) => {
    try {
      const time = new Date().toLocaleTimeString("de-DE", {
        timeZone: timezone,
      });
      return JSON.stringify({
        time,
        timezone,
      });
    } catch (error) {
      console.error("Fehler beim Zeit-API Aufruf:", error);
      throw error;
    }
  },
};
