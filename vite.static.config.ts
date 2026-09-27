import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "static",
  base: "./",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../static-dist",
    emptyOutDir: true,
  },
});
