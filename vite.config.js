import { join, dirname } from "path";
import { fileURLToPath } from "url";

import viteReact from "@vitejs/plugin-react";
import viteFastifyReact from "@fastify/react/plugin";

const path = fileURLToPath(import.meta.url);

export default {
  root: join(dirname(path), "client"),
  plugins: [viteReact(), viteFastifyReact()],
  ssr: {
    external: ["use-sync-external-store"],
  },
  optimizeDeps: {
    include: [
      "@picovoice/porcupine-web-de-worker",
      "@picovoice/web-voice-processor",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          porcupine: ["@picovoice/porcupine-web-de-worker"],
          voiceProcessor: ["@picovoice/web-voice-processor"],
        },
      },
    },
  },
  worker: {
    format: "es",
    plugins: () => [],
  },
  resolve: {
    alias: {
      "@picovoice": join(dirname(path), "node_modules/@picovoice"),
    },
  },
};
