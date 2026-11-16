import { defineConfig } from "vite";

// Dev only: forward /api to the backend so the browser sees one origin (the backend sends no CORS headers).
// In production Nginx does the same forwarding on port 80. Set API_PROXY to point at another backend.
export default defineConfig({
  server: {
    proxy: { "/api": process.env.API_PROXY || "http://localhost:8000" },
  },
});
