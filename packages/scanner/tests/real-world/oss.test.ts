import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scan } from "../../src/scan.ts";
import { ensureCached } from "./download.ts";
import { targets } from "./targets.ts";

const ENABLED = process.env.OPENCOOKIES_REAL_WORLD === "1";

describe.skipIf(!ENABLED)("real-world OSS apps", () => {
  it("downloads and scans target tarballs in under 30s each", { timeout: 600_000 }, async () => {
    const cached = await ensureCached();
    for (const t of targets) {
      const dir = cached[t.name]!;
      const t0 = performance.now();
      const result = await scan({ cwd: dir });
      const elapsed = performance.now() - t0;

      expect(
        result.cookies.length + result.vendors.length,
        `${t.name} should produce at least one finding`,
      ).toBeGreaterThan(0);

      for (const clean of t.cleanFiles) {
        const cleanPath = join(dir, clean);
        if (!existsSync(cleanPath)) continue;
        const fp = (h: { file: string }) => h.file === cleanPath;
        expect(result.cookies.find(fp), `false positive in ${clean}`).toBeUndefined();
        expect(result.vendors.find(fp), `false positive in ${clean}`).toBeUndefined();
      }

      expect(elapsed, `${t.name} scan took ${elapsed.toFixed(0)}ms`).toBeLessThan(30_000);
    }
  });
});
