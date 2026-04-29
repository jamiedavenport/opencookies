import type { Rule, ScanResult, VendorRegistry } from "@opencookies/scanner";
import type { OpenCookiesConfig } from "@opencookies/core";

export type Mode = "warn" | "error" | "off";

export type OpenCookiesPluginOptions = {
  config: OpenCookiesConfig;
  mode?: Mode;
  include?: string[];
  exclude?: string[];
  rules?: Rule[];
  vendors?: VendorRegistry;
  autoSync?: boolean;
};

export type ResolvedPluginOptions = {
  config: OpenCookiesConfig;
  mode: Mode;
  include?: string[];
  exclude?: string[];
  rules?: Rule[];
  vendors?: VendorRegistry;
  autoSync: boolean;
  root: string;
};

export type { ScanResult };
