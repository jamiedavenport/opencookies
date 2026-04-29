# Contributing to OpenCookies

Thanks for taking the time to contribute. This guide covers the parts of our workflow that aren't obvious from the code: how to author a changeset, what gets a changeset, and how releases are cut.

## Toolchain

OpenCookies uses [Vite+](https://viteplus.dev/guide/) (the `vp` CLI) on top of [Bun](https://bun.com). Most public Changesets examples are written for `pnpm` — substitute `bun` and `vp` accordingly.

```sh
bun install        # install workspace deps
vp check           # format, lint, type-check
vp test --run      # run tests once
vp run -r build    # build every package
```

## Adding a changeset

Every PR that affects a published package must include a changeset.

```sh
bun changeset
```

The interactive prompt asks:

1. Which packages are affected (only the seven publishable ones — `core`, `react`, `vue`, `solid`, `svelte`, `scanner`, `vite` — are listed).
2. The semver intent for each: `patch`, `minor`, or `major`.
3. A one-line summary that becomes the changelog entry.

Commit the generated `.changeset/<id>.md` alongside your code change. Multiple changesets per PR are fine.

### What needs a changeset

- **Yes** — anything in `packages/*/src` that affects published behavior: exports, types, runtime semantics, default options, error messages users observe.
- **No** — internal-only edits: tests, comments, build configuration, repo tooling, examples, docs that ship outside the package.

If the [bot](#changeset-bot) flags a PR that legitimately doesn't need one, run:

```sh
bun changeset --empty
```

…and commit the empty changeset to acknowledge the decision.

## Changeset bot

The [`changeset-bot`](https://github.com/apps/changeset-bot) GitHub App comments on every PR with the current changeset status — what packages are about to bump and at what level, or a reminder if no changeset is present. It updates automatically as you push.

The bot is repo-level configuration; see [post-merge setup](#post-merge-setup) below.

## Release flow (maintainer)

Releases are driven by [`changesets/action`](https://github.com/changesets/action) in `.github/workflows/release.yml`. On every push to `main`:

1. If pending `.changeset/*.md` files exist, the action opens (or updates) a `chore: release packages` PR. That PR consumes the changesets, bumps versions across the seven publishable packages, regenerates `CHANGELOG.md` per package, and refreshes the lockfile.
2. When you merge that release PR, the same workflow runs `bun changeset:publish`, which builds every package and runs `changeset publish` to push the new versions to npm.

You don't run `changeset version` or `changeset publish` locally — both are workflow-driven.

The `cli` and `scripts` packages stay `private: true` and are skipped automatically.

## Post-merge setup

These three steps are repo-level configuration that can't live in the codebase. They only need to be done once.

1. **Install [`changeset-bot`](https://github.com/apps/changeset-bot)** on the `jamiedavenport/opencookies` repo. Without it, PRs missing a changeset are silently allowed through.
2. **Add the `NPM_TOKEN` secret** under Settings → Secrets and variables → Actions. Use a granular access token scoped to the `@opencookies` org with publish rights. Without it, `release.yml` opens version PRs but the publish step fails.
3. **Reserve the `@opencookies` npm org** if not already claimed. The first publish fails with a clear error if the scope isn't owned.
