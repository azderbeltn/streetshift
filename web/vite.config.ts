import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Only these non-secret settings from the root .env reach the browser bundle.
const PUBLIC_KEYS = ["MAP_STYLE_URL", "SPACETIMEDB_URI", "SPACETIMEDB_DB_NAME", "SIM_PORT", "USE_MOCK_SPACETIME", "DEMO_MODE", "CONVEX_URL"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");
  const define: Record<string, string> = {};
  for (const k of PUBLIC_KEYS) define[`import.meta.env.${k}`] = JSON.stringify(env[k] ?? "");
  return { plugins: [react()], define, server: { port: 5173 } };
});
