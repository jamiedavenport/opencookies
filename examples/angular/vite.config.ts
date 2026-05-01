import angular from "@analogjs/vite-plugin-angular";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    angular({
      tsconfig: "./tsconfig.app.json",
    }),
    tailwindcss(),
  ],
});
