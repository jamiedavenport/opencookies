import { evaluate } from "./expr.ts";
import { applyGPC } from "./gpc.ts";
import type {
  ConsentExpr,
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

  const initialJurisdiction = resolveSync(config, config.request);

  let state: ConsentState = applyGPC(
    {
      route: config.initialRoute ?? "cookie",
      categories: config.categories,
      decisions: Object.fromEntries(config.categories.map((c) => [c.key, c.locked === true])),
      jurisdiction: initialJurisdiction.value,
      policyVersion: config.policyVersion ?? "",
      decidedAt: null,
      source: "default",
    },
    config,
  );

  if (initialJurisdiction.pending) {
    void initialJurisdiction.pending.then((value) => {
      commit(applyGPC({ ...state, jurisdiction: value }, config));
    });
  }

  function commit(next: ConsentState): void {
    state = next;
    for (const listener of listeners) listener(state);
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
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    acceptAll() {
      commit({
        ...state,
        decisions: decisionsAll(true),
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    acceptNecessary() {
      commit({
        ...state,
        decisions: decisionsNecessary(),
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    reject() {
      commit({
        ...state,
        decisions: decisionsNecessary(),
        decidedAt: new Date().toISOString(),
        route: "closed",
        source: "user",
      });
    },
    toggle(category: string) {
      const cat = state.categories.find((c) => c.key === category);
      if (!cat || cat.locked === true) return;
      commit({
        ...state,
        decisions: {
          ...state.decisions,
          [category]: !state.decisions[category],
        },
        source: "user",
      });
    },
    save() {
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
