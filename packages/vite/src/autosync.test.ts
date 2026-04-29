import { describe, expect, it } from "vitest";
import type { OpenCookiesConfig } from "@opencookies/core";
import type { ScanResult, VendorHit } from "@opencookies/scanner";
import { buildAutoSync } from "./autosync.ts";

const ga: VendorHit = {
  file: "/root/src/layout.tsx",
  line: 8,
  column: 0,
  vendor: "google-analytics",
  category: "analytics",
  via: "global",
};

const posthog: VendorHit = {
  file: "/root/src/app.tsx",
  line: 14,
  column: 2,
  vendor: "posthog",
  category: "analytics",
  via: "import",
};

const sentry: VendorHit = {
  file: "/root/src/error.ts",
  line: 3,
  column: 0,
  vendor: "sentry",
  category: "error-tracking",
  via: "import",
};

const result: ScanResult = {
  cookies: [],
  vendors: [ga, posthog, sentry],
  ungated: [],
};

describe("buildAutoSync", () => {
  it("returns empty when all detected categories are covered", () => {
    const config: OpenCookiesConfig = {
      categories: [
        { key: "analytics", label: "Analytics" },
        { key: "error-tracking", label: "Error Tracking" },
      ],
    };
    const out = buildAutoSync(result, config, "/root");
    expect(out.uncoveredCategories).toEqual([]);
    expect(out.text).toBe("");
  });

  it("groups uncovered vendors by category", () => {
    const config: OpenCookiesConfig = {
      categories: [{ key: "necessary", label: "Necessary" }],
    };
    const out = buildAutoSync(result, config, "/root");
    expect(out.uncoveredCategories.map((c) => c.category).sort()).toEqual([
      "analytics",
      "error-tracking",
    ]);
    const analytics = out.uncoveredCategories.find((c) => c.category === "analytics");
    expect(analytics?.vendors.map((v) => v.vendor).sort()).toEqual(["google-analytics", "posthog"]);
    expect(out.text).toContain('{ key: "analytics", label: "Analytics" }');
    expect(out.text).toContain('{ key: "error-tracking", label: "Error Tracking" }');
    expect(out.text).toContain("src/layout.tsx:8");
  });

  it("dedupes a vendor seen multiple times in the same category", () => {
    const dup: VendorHit = { ...ga, line: 99 };
    const r: ScanResult = { cookies: [], vendors: [ga, dup], ungated: [] };
    const config: OpenCookiesConfig = { categories: [] };
    const out = buildAutoSync(r, config, "/root");
    expect(out.uncoveredCategories[0]?.vendors).toHaveLength(1);
  });
});
