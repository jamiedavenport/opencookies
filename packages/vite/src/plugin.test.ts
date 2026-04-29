import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { OpenCookiesConfig } from "@opencookies/core";
import { openCookies } from "./plugin.ts";
import type { Logger } from "./reporter.ts";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "..", "__fixtures__", "projects");

const baseConfig: OpenCookiesConfig = {
  categories: [{ key: "necessary", label: "Necessary" }],
};

function makeLogger(): {
  logger: Logger;
  info: string[];
  warn: string[];
  error: string[];
} {
  const info: string[] = [];
  const warn: string[] = [];
  const error: string[] = [];
  return {
    logger: {
      info: (m) => info.push(m),
      warn: (m) => warn.push(m),
      error: (m) => error.push(m),
    },
    info,
    warn,
    error,
  };
}

function unwrap<T>(hook: unknown): T {
  if (!hook) throw new Error("hook missing");
  if (typeof hook === "function") return hook as T;
  return (hook as { handler: T }).handler;
}

async function runScan(
  projectName: string,
  options: { mode?: "warn" | "error" | "off"; autoSync?: boolean; config?: OpenCookiesConfig },
) {
  const root = join(FIXTURES, projectName);
  const { logger, info, warn, error } = makeLogger();
  const plugin = openCookies({
    config: options.config ?? baseConfig,
    mode: options.mode,
    autoSync: options.autoSync,
  });
  const configResolved = unwrap<
    (c: { root: string; command: "serve" | "build"; logger: Logger }) => void
  >(plugin.configResolved);
  const buildStart = unwrap<() => Promise<void>>(plugin.buildStart);
  const buildEnd = unwrap<(err?: Error) => void>(plugin.buildEnd);
  configResolved.call(plugin, {
    root,
    command: options.mode === "error" ? "build" : "serve",
    logger,
  });
  await buildStart.call(plugin);
  return { plugin, info, warn, error, root, buildEnd: () => buildEnd.call(plugin) };
}

describe("openCookies plugin", () => {
  it("warns on ungated findings in dev", async () => {
    const { warn, info } = await runScan("ungated-vendor", { mode: "warn" });
    expect(warn.length).toBeGreaterThan(0);
    expect(warn.some((m) => m.includes("posthog"))).toBe(true);
    expect(warn.some((m) => m.includes("google-analytics"))).toBe(true);
    expect(info.some((m) => m.includes("ungated"))).toBe(true);
  });

  it("throws at buildEnd in error mode when ungated findings remain", async () => {
    const ctx = await runScan("ungated-vendor", { mode: "error" });
    expect(() => ctx.buildEnd()).toThrowError(/ungated/);
  });

  it("does not throw at buildEnd when project is clean", async () => {
    const ctx = await runScan("clean", { mode: "error" });
    expect(() => ctx.buildEnd()).not.toThrow();
  });

  it("does not flag vendor calls inside ConsentGate", async () => {
    const { warn } = await runScan("gated-vendor", { mode: "warn" });
    expect(warn.filter((m) => m.includes("ungated"))).toHaveLength(0);
  });

  it("emits autoSync suggestions when uncovered categories exist", async () => {
    const { info } = await runScan("ungated-vendor", { mode: "warn", autoSync: true });
    expect(info.some((m) => m.includes("autoSync"))).toBe(true);
    expect(info.some((m) => m.includes("analytics"))).toBe(true);
  });

  it("is a no-op in off mode", async () => {
    const { warn, error, info } = await runScan("ungated-vendor", { mode: "off" });
    expect(warn).toHaveLength(0);
    expect(error).toHaveLength(0);
    expect(info).toHaveLength(0);
  });

  it("rescans a single file on hot update under 50ms", async () => {
    const root = join(FIXTURES, "ungated-vendor");
    const { logger, warn } = makeLogger();
    const plugin = openCookies({ config: baseConfig, mode: "warn" });
    const configResolved = unwrap<
      (c: { root: string; command: "serve" | "build"; logger: Logger }) => void
    >(plugin.configResolved);
    const buildStart = unwrap<() => Promise<void>>(plugin.buildStart);
    const handleHotUpdate = unwrap<
      (c: { file: string; read: () => string | Promise<string> }) => Promise<unknown>
    >(plugin.handleHotUpdate);

    configResolved.call(plugin, { root, command: "serve", logger });
    await buildStart.call(plugin);
    warn.length = 0;

    const file = join(root, "src", "main.ts");
    const original = readFileSync(file, "utf8");

    const start = performance.now();
    await handleHotUpdate.call(plugin, { file, read: async () => original });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("clears ungated findings when an HMR edit removes the call", async () => {
    const root = join(FIXTURES, "ungated-vendor");
    const { logger, info } = makeLogger();
    const plugin = openCookies({ config: baseConfig, mode: "warn" });
    unwrap<(c: { root: string; command: "serve" | "build"; logger: Logger }) => void>(
      plugin.configResolved,
    ).call(plugin, { root, command: "serve", logger });
    await unwrap<() => Promise<void>>(plugin.buildStart).call(plugin);
    info.length = 0;

    const file = join(root, "src", "main.ts");
    await unwrap<(c: { file: string; read: () => string | Promise<string> }) => Promise<unknown>>(
      plugin.handleHotUpdate,
    ).call(plugin, { file, read: async () => "export const noop = 1;\n" });

    expect(info.some((m) => m.includes("cleared"))).toBe(true);
  });
});
