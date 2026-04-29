import { relative } from "node:path";
import type { ScanResult, VendorHit } from "@opencookies/scanner";
import type { OpenCookiesConfig } from "@opencookies/core";

export type AutoSyncReport = {
  uncoveredCategories: Array<{
    category: string;
    vendors: Array<{ vendor: string; example: VendorHit }>;
  }>;
  text: string;
};

export function buildAutoSync(
  result: ScanResult,
  config: OpenCookiesConfig,
  root: string,
): AutoSyncReport {
  const known = new Set(config.categories.map((c) => c.key));
  const byCategory = new Map<string, Map<string, VendorHit>>();

  for (const v of result.vendors) {
    if (known.has(v.category)) continue;
    let bucket = byCategory.get(v.category);
    if (!bucket) {
      bucket = new Map();
      byCategory.set(v.category, bucket);
    }
    if (!bucket.has(v.vendor)) bucket.set(v.vendor, v);
  }

  const uncoveredCategories = [...byCategory.entries()]
    .map(([category, vendors]) => ({
      category,
      vendors: [...vendors.entries()].map(([vendor, example]) => ({ vendor, example })),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  if (uncoveredCategories.length === 0) {
    return { uncoveredCategories, text: "" };
  }

  const lines: string[] = ["[opencookies] autoSync: detected vendors not covered by your config"];
  for (const { category, vendors } of uncoveredCategories) {
    const vendorList = vendors
      .map(({ vendor, example }) => `${vendor} (${rel(example.file, root)}:${example.line})`)
      .join(", ");
    lines.push(`  + ${category} — ${vendorList}`);
  }
  lines.push("Add to your OpenCookies config categories:");
  lines.push("  categories: [");
  for (const { category } of uncoveredCategories) {
    lines.push(
      `    { key: ${JSON.stringify(category)}, label: ${JSON.stringify(titleize(category))} },`,
    );
  }
  lines.push("  ]");

  return { uncoveredCategories, text: lines.join("\n") };
}

function rel(file: string, root: string): string {
  const r = relative(root, file);
  return r === "" || r.startsWith("..") ? file : r;
}

function titleize(key: string): string {
  return key
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}
