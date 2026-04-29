import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: [
      "src/index.ts",
      "src/cli.ts",
      "src/ga4.ts",
      "src/google-tag-manager.ts",
      "src/hotjar.ts",
      "src/meta-pixel.ts",
      "src/posthog.ts",
      "src/segment.ts",
    ],
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
