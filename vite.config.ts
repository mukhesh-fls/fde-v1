/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { mentorApi } from "./server/vitePlugin";

export default defineConfig(({ mode }) => {
  // Make ANTHROPIC_API_KEY from .env available to the server route (never to the browser bundle).
  const env = loadEnv(mode, process.cwd(), "ANTHROPIC_");
  for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
  return {
    plugins: [react(), mentorApi()],
    server: { port: 5173 },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
