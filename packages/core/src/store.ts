import { evaluate } from "./expr.ts";
import { applyGPC } from "./gpc.ts";
import { resolveLocale } from "./locale.ts";
import { fromUnknown, recordEquals, toRecord } from "./storage/record.ts";
import type {
  ActionOptions,
  ConsentExpr,
  ConsentRecord,
  ConsentRecordSource,
  ConsentState,
  ConsentStore,
  Jurisdiction,
  OpenCookiesConfig,
  ResolverContext,
  Route,
} from "./types.ts";

type Listener = (state: ConsentState) => void;

export function createConsentStore(config: OpenCookiesConfig): ConsentStore {
  const listeners = new Set<Listener>();
  const locale = resolveLocale(config);

  const initialJurisdiction = resolveSync(config, config.request);
  const initialRecord = readSync(config, locale);

  let state: ConsentState = applyGPC(
    mergeRecord(
      {
        route: config.initialRoute ?? "cookie",
        categories: config.categories,
        decisions: Object.fromEntries(config.categories.map((c) => [c.key, c.locked === true])),
        jurisdiction: initialJurisdiction.value,
        policyVersion: config.policyVersion ?? "",
        decidedAt: null,
        source: "default",
      },
      initialRecord.value,
    ),
    config,
  );

  let lastDecisionSource: ConsentRecordSource | null = initialRecord.value?.source ?? null;
  let lastWritten: ConsentRecord | null = initialRecord.value;
  let suspendWrite = false;

  if (initialRecord.pending) {
    void initialRecord.pending.then((record) => {
      if (record === null) return;
      suspendWrite = true;
      commit(applyGPC(mergeRecord(state, record), config));
      suspendWrite = false;
      lastDecisionSource = record.source;
      lastWritten = record;
    });
  }

  if (initialJurisdiction.pending) {
    void initialJurisdiction.pending.then((value) => {
      commit(applyGPC({ ...state, jurisdiction: value }, config));
    });
  }

  if (config.adapter?.subscribe) {
    config.adapter.subscribe((raw) => {
      const record = fromUnknown(raw, locale);
      if (record === null) return;
      suspendWrite = true;
      commit(applyGPC(mergeRecord(state, record), config));
      suspendWrite = false;
      lastDecisionSource = record.source;
      lastWritten = record;
    });
  }

  function commit(next: ConsentState): void {
    state = next;
    for (const listener of listeners) listener(state);
    persist();
  }

  function persist(): void {
    if (!config.adapter || suspendWrite) return;
    if (state.decidedAt === null || lastDecisionSource === null) return;
    const record = toRecord(state, lastDecisionSource, locale);
    if (lastWritten && recordEquals(lastWritten, record)) return;
    lastWritten = record;
    try {
      const result = config.adapter.write(record);
      if (isPromise(result)) {
        result.catch((err) => {
          console.warn("[opencookies] adapter.write failed:", err);
        });
      }
    } catch (err) {
      console.warn("[opencookies] adapter.write failed:", err);
    }
  }

  function inferSource(routeBefore: Route, opts?: ActionOptions): ConsentRecordSource {
    if (opts?.source) return opts.source;
    return routeBefore === "preferences" ? "preferences" : "banner";
  }

  function decisionsAll(value: boolean): Record<string, boolean> {
    return Object.fromEntries(state.categories.map((c) => [c.key, value]));
  }

  function decisionsNecessary(): Record<string, boolean> {
    return Object.fromEntries(state.categories.map((c) => [c.key, c.locked === true]));
  }

  return {
    getState() {
      return state;
    },
    getConsentRecord() {
      if (state.decidedAt === null || lastDecisionSource === null) return null;
      return toRecord(state, lastDecisionSource, locale);
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    acceptAll(opts?: ActionOptions) {
      lastDecisionSource = inferSource(state.route, opts);
      commit({
        ...state,
        decisions: decisionsAll(true),
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    acceptNecessary(opts?: ActionOptions) {
      lastDecisionSource = inferSource(state.route, opts);
      commit({
        ...state,
        decisions: decisionsNecessary(),
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    reject(opts?: ActionOptions) {
      lastDecisionSource = inferSource(state.route, opts);
      commit({
        ...state,
        decisions: decisionsNecessary(),
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    toggle(category: string, opts?: ActionOptions) {
      const cat = state.categories.find((c) => c.key === category);
      if (!cat || cat.locked === true) return;
      lastDecisionSource = inferSource(state.route, opts);
      commit({
        ...state,
        decisions: {
          ...state.decisions,
          [category]: !state.decisions[category],
        },
        source: "user",
      });
    },
    save(opts?: ActionOptions) {
      lastDecisionSource = inferSource(state.route, opts);
      commit({
        ...state,
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    setRoute(route: Route) {
      if (state.route === route) return;
      commit({ ...state, route });
    },
    has(expr: ConsentExpr) {
      return evaluate(expr, state, {
        onUnknownCategory: config.onUnknownCategory,
      });
    },
    async refreshJurisdiction(req?: ResolverContext) {
      const resolver = config.jurisdictionResolver;
      if (!resolver) return state.jurisdiction;
      let raw: Promise<Jurisdiction | null> | Jurisdiction | null;
      try {
        raw = resolver.resolve(req ?? config.request);
      } catch (err) {
        warnResolverError(err);
        return state.jurisdiction;
      }
      const next = await safeResolve(raw);
      if (next.ok) commit(applyGPC({ ...state, jurisdiction: next.value }, config));
      return state.jurisdiction;
    },
  };
}

type InitialJurisdiction = {
  value: Jurisdiction | null;
  pending: Promise<Jurisdiction | null> | null;
};

function resolveSync(
  config: OpenCookiesConfig,
  req: ResolverContext | undefined,
): InitialJurisdiction {
  const resolver = config.jurisdictionResolver;
  if (!resolver) return { value: null, pending: null };

  let result: Promise<Jurisdiction | null> | Jurisdiction | null;
  try {
    result = resolver.resolve(req);
  } catch (err) {
    warnResolverError(err);
    return { value: null, pending: null };
  }

  if (isPromise(result)) {
    const pending = safeResolve(result).then((r) => (r.ok ? r.value : null));
    return { value: null, pending };
  }
  return { value: result, pending: null };
}

type ResolveOutcome = { ok: true; value: Jurisdiction | null } | { ok: false };

async function safeResolve(
  result: Promise<Jurisdiction | null> | Jurisdiction | null,
): Promise<ResolveOutcome> {
  try {
    const value = await result;
    return { ok: true, value };
  } catch (err) {
    warnResolverError(err);
    return { ok: false };
  }
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function warnResolverError(err: unknown): void {
  console.warn("[opencookies] jurisdiction resolver failed:", err);
}

type InitialRecord = {
  value: ConsentRecord | null;
  pending: Promise<ConsentRecord | null> | null;
};

function readSync(config: OpenCookiesConfig, locale: string): InitialRecord {
  if (!config.adapter) return { value: null, pending: null };
  let result: Promise<ConsentRecord | null> | ConsentRecord | null;
  try {
    result = config.adapter.read();
  } catch (err) {
    console.warn("[opencookies] adapter.read failed:", err);
    return { value: null, pending: null };
  }
  if (isPromise(result)) {
    const pending = result
      .then((raw) => fromUnknown(raw, locale))
      .catch((err) => {
        console.warn("[opencookies] adapter.read failed:", err);
        return null;
      });
    return { value: null, pending };
  }
  return { value: fromUnknown(result, locale), pending: null };
}

function mergeRecord(state: ConsentState, record: ConsentRecord | null): ConsentState {
  if (!record) return state;
  const decisions: Record<string, boolean> = { ...state.decisions };
  for (const c of state.categories) {
    if (c.locked === true) {
      decisions[c.key] = true;
      continue;
    }
    if (Object.hasOwn(record.decisions, c.key)) {
      decisions[c.key] = record.decisions[c.key] === true;
    }
  }
  return {
    ...state,
    decisions,
    jurisdiction: record.jurisdiction ?? state.jurisdiction,
    policyVersion: record.policyVersion || state.policyVersion,
    decidedAt: record.decidedAt,
    source: "user",
  };
}
