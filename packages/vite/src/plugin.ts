import { readFile } from "node:fs/promises";
import {
  applySuppressions,
  defaultRules,
  defaultVendors,
  parseFile,
  scan,
  walk,
} from "@opencookies/scanner";
import type { Hit, ScanResult, Ungated } from "@opencookies/scanner";
import type { Plugin } from "vite";
import { buildAutoSync } from "./autosync.ts";
import { formatHitLocation, formatUngated, report, reportFileDelta } from "./reporter.ts";
import type { Logger } from "./reporter.ts";
import type { Mode, OpenCookiesPluginOptions, ResolvedPluginOptions } from "./types.ts";

const PLUGIN_NAME = "@opencookies/vite";

type ConfigLike = {
  root: string;
  command: "serve" | "build";
  logger?: Logger;
};

export function openCookies(options: OpenCookiesPluginOptions): Plugin {
  let resolved: ResolvedPluginOptions | undefined;
  let logger: Logger = consoleLogger();
  let lastScan: ScanResult | undefined;

  const ungatedByFile = new Map<string, Ungated[]>();
  const cookiesByFile = new Map<string, Hit[]>();
  const vendorsByFile = new Map<string, Hit[]>();

  function indexResult(result: ScanResult): void {
    ungatedByFile.clear();
    cookiesByFile.clear();
    vendorsByFile.clear();
    for (const u of result.ungated) push(ungatedByFile, u.hit.file, u);
    for (const c of result.cookies) push(cookiesByFile, c.file, c);
    for (const v of result.vendors) push(vendorsByFile, v.file, v);
  }

  return {
    name: PLUGIN_NAME,

    configResolved(config: ConfigLike) {
      const mode: Mode = options.mode ?? (config.command === "build" ? "error" : "warn");
      resolved = {
        config: options.config,
        mode,
        include: options.include,
        exclude: options.exclude,
        rules: options.rules,
        vendors: options.vendors,
        autoSync: options.autoSync ?? false,
        root: config.root,
      };
      if (config.logger) logger = config.logger;
    },

    async buildStart() {
      if (!resolved) return;
      if (resolved.mode === "off") return;

      const result = await scan({
        cwd: resolved.root,
        include: resolved.include,
        exclude: resolved.exclude,
        rules: resolved.rules,
        vendors: resolved.vendors,
      });

      lastScan = result;
      indexResult(result);
      report(result, logger, { mode: resolved.mode, root: resolved.root });

      if (resolved.autoSync) {
        const sync = buildAutoSync(result, resolved.config, resolved.root);
        if (sync.text) logger.info(sync.text);
      }
    },

    async handleHotUpdate(ctx: { file: string; read?: () => string | Promise<string> }) {
      if (!resolved) return;
      if (resolved.mode === "off") return;
      if (!shouldScan(ctx.file)) return;

      let source: string;
      try {
        source = ctx.read ? await ctx.read() : await readFile(ctx.file, "utf8");
      } catch {
        return;
      }

      const fileResult = scanOneFile(ctx.file, source, resolved);
      if (!fileResult) return;

      const prevUngated = ungatedByFile.get(ctx.file) ?? [];

      if (fileResult.cookies.length === 0 && fileResult.vendors.length === 0) {
        cookiesByFile.delete(ctx.file);
        vendorsByFile.delete(ctx.file);
      } else {
        cookiesByFile.set(ctx.file, fileResult.cookies);
        vendorsByFile.set(ctx.file, fileResult.vendors);
      }
      if (fileResult.ungated.length === 0) ungatedByFile.delete(ctx.file);
      else ungatedByFile.set(ctx.file, fileResult.ungated);

      lastScan = rebuildResult(cookiesByFile, vendorsByFile, ungatedByFile);

      reportFileDelta(prevUngated, fileResult.ungated, logger, {
        mode: resolved.mode,
        root: resolved.root,
        file: ctx.file,
      });
    },

    buildEnd(error?: Error) {
      if (!resolved) return;
      if (error) return;
      if (resolved.mode !== "error") return;
      const result = lastScan;
      if (!result || result.ungated.length === 0) return;
      const first = result.ungated[0]!;
      const loc = formatHitLocation(first.hit, resolved.root);
      const summary = formatUngated(first, resolved.root);
      const more = result.ungated.length > 1 ? ` (+${result.ungated.length - 1} more)` : "";
      const err = new Error(`[opencookies] ungated finding at ${loc}${more}\n${summary}`);
      throw err;
    },
  };
}

function push<T>(map: Map<string, T[]>, key: string, value: T): void {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

function shouldScan(file: string): boolean {
  return /\.(?:[mc]?[jt]sx?|vue|svelte)$/.test(file);
}

type FileScanResult = {
  cookies: Hit[];
  vendors: Hit[];
  ungated: Ungated[];
};

function scanOneFile(
  file: string,
  source: string,
  opts: ResolvedPluginOptions,
): FileScanResult | null {
  const parsed = parseFile(file, source);
  if (!parsed) return null;
  const rules = opts.rules ?? defaultRules;
  const registry = opts.vendors ?? defaultVendors;
  const result = walk(parsed, rules, registry);
  const filtered = applySuppressions(result.hits, parsed.comments);
  const kept = new Set(filtered);
  const cookies: Hit[] = [];
  const vendors: Hit[] = [];
  for (const h of filtered) {
    if ("kind" in h) cookies.push(h);
    else vendors.push(h);
  }
  const ungated = result.ungated.filter((u: Ungated) => kept.has(u.hit));
  return { cookies, vendors, ungated };
}

function rebuildResult(
  cookiesByFile: Map<string, Hit[]>,
  vendorsByFile: Map<string, Hit[]>,
  ungatedByFile: Map<string, Ungated[]>,
): ScanResult {
  const cookies: ScanResult["cookies"] = [];
  const vendors: ScanResult["vendors"] = [];
  const ungated: Ungated[] = [];
  for (const arr of cookiesByFile.values()) {
    for (const h of arr) if ("kind" in h) cookies.push(h);
  }
  for (const arr of vendorsByFile.values()) {
    for (const h of arr) if (!("kind" in h)) vendors.push(h);
  }
  for (const arr of ungatedByFile.values()) ungated.push(...arr);
  cookies.sort(orderHits);
  vendors.sort(orderHits);
  ungated.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));
  return { cookies, vendors, ungated };
}

function orderHits(a: { file: string; line: number; column: number }, b: typeof a): number {
  if (a.file !== b.file) return a.file.localeCompare(b.file);
  if (a.line !== b.line) return a.line - b.line;
  return a.column - b.column;
}

function consoleLogger(): Logger {
  return {
    info: (msg: string) => {
      console.log(msg);
    },
    warn: (msg: string) => {
      console.warn(msg);
    },
    error: (msg: string) => {
      console.error(msg);
    },
  };
}
