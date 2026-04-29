export { OpenCookiesError } from "./errors.ts";
export type { OpenCookiesErrorCode } from "./errors.ts";
export { evaluate } from "./expr.ts";
export { GPC_LEGALLY_REQUIRED_JURISDICTIONS, applyGPC, gpcApplies, readGPCSignal } from "./gpc.ts";
export {
  clientGeoResolver,
  countryToJurisdiction,
  headerResolver,
  manualResolver,
} from "./jurisdiction.ts";
export { defineScript, gateScript, gateScripts } from "./scripts.ts";
export { createConsentStore } from "./store.ts";
export type {
  Category,
  ConsentExpr,
  ConsentRecord,
  ConsentSource,
  ConsentState,
  ConsentStore,
  EvaluateOptions,
  GateOptions,
  GPCConfig,
  Jurisdiction,
  JurisdictionResolver,
  OpenCookiesConfig,
  ResolverContext,
  Route,
  ScriptDefinition,
  ScriptEvent,
  StorageAdapter,
  UnknownCategoryBehavior,
} from "./types.ts";
