import type { ConsentExpr, ConsentState, ConsentStore, OpenCookiesConfig, Route } from "./types.ts";

type Listener = (state: ConsentState) => void;

export function createConsentStore(config: OpenCookiesConfig): ConsentStore {
  const listeners = new Set<Listener>();

  let state: ConsentState = {
    route: config.initialRoute ?? "cookie",
    categories: config.categories,
    decisions: Object.fromEntries(config.categories.map((c) => [c.key, c.locked === true])),
    jurisdiction: null,
    policyVersion: config.policyVersion ?? "",
    decidedAt: null,
  };

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
      });
    },
    acceptNecessary() {
      commit({
        ...state,
        decisions: decisionsNecessary(),
        decidedAt: new Date().toISOString(),
        route: "closed",
      });
    },
    reject() {
      commit({
        ...state,
        decisions: decisionsNecessary(),
        decidedAt: new Date().toISOString(),
        route: "closed",
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
      });
    },
    save() {
      commit({
        ...state,
        decidedAt: new Date().toISOString(),
        route: "closed",
      });
    },
    setRoute(route: Route) {
      if (state.route === route) return;
      commit({ ...state, route });
    },
    has(expr: string | ConsentExpr) {
      if (typeof expr !== "string") return false;
      return state.decisions[expr] === true;
    },
  };
}
