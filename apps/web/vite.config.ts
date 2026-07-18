import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  // HTTPS is required for getUserMedia (mic) on any origin other than localhost,
  // e.g. when opening the dev server from a phone via LAN IP.
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": "https://buildathon-2026.onrender.com/",
      "/health": "https://buildathon-2026.onrender.com/",
    },
  },
});
