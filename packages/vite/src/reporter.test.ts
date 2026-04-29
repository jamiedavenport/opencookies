import { describe, expect, it } from "vitest";
import {
  formatHitLocation,
  formatSummary,
  formatUngated,
  report,
  reportFileDelta,
} from "./reporter.ts";
import type { Logger } from "./reporter.ts";
import type { ScanResult, Ungated, VendorHit } from "@opencookies/scanner";

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

const sampleVendor: VendorHit = {
  file: "/root/src/app.tsx",
  line: 12,
  column: 3,
  vendor: "google-analytics",
  category: "analytics",
  via: "global",
};

const sampleUngated: Ungated = {
  file: sampleVendor.file,
  line: sampleVendor.line,
  reason: "vendor-outside-gate",
  hit: sampleVendor,
};

describe("formatHitLocation", () => {
  it("renders relative paths under root", () => {
    expect(formatHitLocation(sampleVendor, "/root")).toBe("src/app.tsx:12:3");
  });

  it("falls back to absolute when outside root", () => {
    expect(formatHitLocation(sampleVendor, "/elsewhere")).toBe("/root/src/app.tsx:12:3");
  });
});

describe("formatUngated", () => {
  it("includes rule, fix, and suppression syntax", () => {
    const text = formatUngated(sampleUngated, "/root");
    expect(text).toContain("ungated google-analytics");
    expect(text).toContain("src/app.tsx:12:3");
    expect(text).toContain("Rule: vendor-imports");
    expect(text).toContain("Fix:");
    expect(text).toContain("// opencookies-ignore-next-line");
  });
});

describe("formatSummary", () => {
  it("counts cookies, vendors, ungated", () => {
    const result: ScanResult = {
      cookies: [
        {
          file: "/root/a.ts",
          line: 1,
          column: 0,
          kind: "document.cookie",
        },
      ],
      vendors: [sampleVendor],
      ungated: [sampleUngated],
    };
    expect(formatSummary(result)).toBe("[opencookies] 1 cookies, 1 vendors, 1 ungated");
  });
});

describe("report", () => {
  it("warns on ungated in warn mode", () => {
    const { logger, info, warn, error } = makeLogger();
    const result: ScanResult = { cookies: [], vendors: [sampleVendor], ungated: [sampleUngated] };
    report(result, logger, { mode: "warn", root: "/root" });
    expect(warn.length).toBeGreaterThanOrEqual(1);
    expect(error).toHaveLength(0);
    expect(info.some((m) => m.includes("1 ungated"))).toBe(true);
  });

  it("uses error severity in error mode", () => {
    const { logger, error, warn } = makeLogger();
    const result: ScanResult = { cookies: [], vendors: [sampleVendor], ungated: [sampleUngated] };
    report(result, logger, { mode: "error", root: "/root" });
    expect(error.length).toBeGreaterThanOrEqual(1);
    expect(warn).toHaveLength(0);
  });

  it("is a no-op in off mode", () => {
    const { logger, info, warn, error } = makeLogger();
    const result: ScanResult = { cookies: [], vendors: [sampleVendor], ungated: [sampleUngated] };
    report(result, logger, { mode: "off", root: "/root" });
    expect(info).toHaveLength(0);
    expect(warn).toHaveLength(0);
    expect(error).toHaveLength(0);
  });
});

describe("reportFileDelta", () => {
  it("logs only added findings on update", () => {
    const { logger, warn, info } = makeLogger();
    const second: Ungated = {
      ...sampleUngated,
      line: 20,
      hit: { ...sampleVendor, line: 20 },
    };
    reportFileDelta([sampleUngated], [sampleUngated, second], logger, {
      mode: "warn",
      root: "/root",
      file: sampleVendor.file,
    });
    expect(warn).toHaveLength(1);
    expect(warn[0]).toContain(":20:");
    expect(info).toHaveLength(0);
  });

  it("notes when findings clear", () => {
    const { logger, info, warn } = makeLogger();
    reportFileDelta([sampleUngated], [], logger, {
      mode: "warn",
      root: "/root",
      file: sampleVendor.file,
    });
    expect(warn).toHaveLength(0);
    expect(info[0]).toContain("cleared");
  });
});
