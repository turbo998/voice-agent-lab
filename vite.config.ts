import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "apps/retell-demo/client",
  plugins: [react()],
  build: { outDir: "../../../dist/ui", emptyOutDir: true },
  server: { proxy: { "/api": "http://127.0.0.1:8080", "/retell": { target: "http://127.0.0.1:8080", ws: true } } },
});
