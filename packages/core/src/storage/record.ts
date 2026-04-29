import type { ConsentRecord, ConsentState } from "../types.ts";

export function toRecord(state: ConsentState): ConsentRecord {
  return {
    decisions: { ...state.decisions },
    jurisdiction: state.jurisdiction,
    policyVersion: state.policyVersion,
    decidedAt: state.decidedAt,
    source: state.source,
  };
}

export function recordEquals(a: ConsentRecord, b: ConsentRecord): boolean {
  if (
    a.jurisdiction !== b.jurisdiction ||
    a.policyVersion !== b.policyVersion ||
    a.decidedAt !== b.decidedAt ||
    a.source !== b.source
  ) {
    return false;
  }
  const aKeys = Object.keys(a.decisions);
  const bKeys = Object.keys(b.decisions);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a.decisions[k] !== b.decisions[k]) return false;
  }
  return true;
}
