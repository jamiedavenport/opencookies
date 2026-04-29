import type { Rule } from "./types.ts";

export { scan, defaultRules, defaultVendors } from "./scan.ts";
export { cookiesNextRule } from "./rules/cookies-next.ts";
export { documentCookieRule } from "./rules/document-cookie.ts";
export { jsCookieRule } from "./rules/js-cookie.ts";
export { nextHeadersRule } from "./rules/next-headers.ts";
export { reactCookieRule } from "./rules/react-cookie.ts";
export { setCookieHeaderRule } from "./rules/set-cookie-header.ts";
export { vendorImportsRule } from "./rules/vendor-imports.ts";
export { calleeMatches, getStringArg, isCallTo } from "./visit.ts";
export type {
  AnyNode,
  Cookie,
  CookieKind,
  Hit,
  ImportInfo,
  Rule,
  ScanOptions,
  ScanResult,
  Ungated,
  VendorEntry,
  VendorHit,
  VendorRegistry,
  VendorVia,
  VisitContext,
} from "./types.ts";

export function defineRule(rule: Rule): Rule {
  return rule;
}
