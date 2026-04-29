import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    ignorePatterns: ["__fixtures__/**", "tests/real-world/.cache/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["**/__fixtures__/**", "**/tests/real-world/.cache/**", "**/dist/**"],
  },
});
