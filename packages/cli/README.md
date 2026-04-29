# @opencookies/cli

Terminal entry point for OpenCookies. Wraps [`@opencookies/scanner`](../scanner/) for one-off scans, config init, and writing back vendor-category suggestions that the [Vite plugin](../vite/) only prints.

> Status: scaffold. The package and `opencookies` bin are reserved; the implementation is in flight. For build-time scanning today, use [`@opencookies/vite`](../vite/) — same scanner, integrated with HMR and `vite build`.

## Install

```sh
bun add -D @opencookies/cli
```

## Usage

```sh
opencookies --help
```

## Planned commands

- `opencookies scan` — run the scanner against a project, print findings.
- `opencookies init` — scaffold a starter `cookies.config.ts` with the categories the scanner detected.
- `opencookies sync` — apply the vendor-category suggestions the Vite plugin prints when `autoSync: true`, writing them to your config file.

Track progress in the repo issues.

## See also

- [`@opencookies/scanner`](../scanner/) — the detection engine the CLI wraps
- [`@opencookies/vite`](../vite/) — recommended for in-editor / CI feedback today
- [`@opencookies/core`](../core/) — runtime config the CLI generates and edits

## License

Apache-2.0
