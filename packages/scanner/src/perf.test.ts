import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scan } from "./scan.ts";

const FILE_COUNT = 1000;

function template(i: number): string {
  switch (i % 5) {
    case 0:
      return `// file ${i}\nimport posthog from "posthog-js";\nposthog.capture("evt-${i}");\n`;
    case 1:
      return `// file ${i}\ndocument.cookie = "k${i}=v";\n`;
    case 2:
      return `// file ${i}\nimport { setCookie } from "cookies-next";\nsetCookie("k${i}", "v");\n`;
    case 3:
      return `// file ${i}\nexport function add(a: number, b: number) { return a + b + ${i}; }\n`;
    default:
      return `// file ${i}\nimport { cookies } from "next/headers";\nexport async function f() { (await cookies()).set("k${i}", "v"); }\n`;
  }
}

describe("perf", () => {
  it("scans 1000 files in under 2s", { timeout: 30_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), "opencookies-perf-"));
    mkdirSync(join(root, "src"), { recursive: true });
    for (let i = 0; i < FILE_COUNT; i++) {
      writeFileSync(join(root, "src", `f${i}.ts`), template(i));
    }
    const t0 = performance.now();
    const result = await scan({ cwd: root });
    const elapsed = performance.now() - t0;
    expect(result.cookies.length + result.vendors.length).toBeGreaterThan(0);
    expect(elapsed, `scan took ${elapsed.toFixed(0)}ms`).toBeLessThan(2000);
  });
});
