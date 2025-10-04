import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    allowedHosts: [
      "conclusion-screensaver-academics-urge.trycloudflare.com"
    ]
  }
});
