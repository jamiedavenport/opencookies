# OpenCookies Angular example

A standalone Angular 19 app that demonstrates the [`@opencookies/angular`](../../packages/angular/) adapter end-to-end:

- `bootstrapApplication` + `provideOpenCookies` in [`src/main.ts`](./src/main.ts)
- `inject(ConsentService)` for the banner, header, and preferences modal
- `injectCategory("analytics")` plus per-category toggles in the preferences modal
- The `*ocConsent="'analytics'; else fallback"` structural directive gating a chart
- A debug strip that prints the live signal-backed state as JSON

## Running

```sh
pnpm --filter ./examples/angular build
pnpm --filter ./examples/angular dev
```

The `@analogjs/vite-plugin-angular` plugin runs in JIT mode here so its transform pipeline cooperates with Vite+ (Rolldown / Oxc). Vite+ logs a deprecation warning about the plugin's `optimizeDeps.esbuildOptions` usage, which is harmless — the build/dev server still produces a working bundle.

## License

Apache-2.0
