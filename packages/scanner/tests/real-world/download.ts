import { execFile } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { targets } from "./targets.ts";

const exec = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".cache");

export async function ensureCached(): Promise<Record<string, string>> {
  mkdirSync(CACHE, { recursive: true });
  const out: Record<string, string> = {};
  for (const t of targets) {
    const dest = join(CACHE, `${t.name}-${t.sha}`);
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
      const tgzPath = `${dest}.tar.gz`;
      if (!existsSync(tgzPath)) {
        const url = `https://codeload.github.com/${t.repo}/tar.gz/${t.sha}`;
        const res = await fetch(url);
        if (!res.ok || !res.body) {
          throw new Error(`failed to fetch ${url}: ${res.status}`);
        }
        await pipeline(Readable.fromWeb(res.body as never), createWriteStream(tgzPath));
      }
      await exec("tar", ["-xzf", tgzPath, "-C", dest, "--strip-components", "1"]);
    }
    out[t.name] = dest;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void ensureCached().then((map) => {
    for (const [name, path] of Object.entries(map)) {
      process.stdout.write(`${name}: ${path}\n`);
    }
  });
}
