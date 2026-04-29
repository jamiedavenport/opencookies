import { afterEach, describe, expect, it, vi } from "vitest";
import { manualResolver } from "./jurisdiction.ts";
import { createConsentStore } from "./store.ts";
import type { Category, JurisdictionResolver, OpenCookiesConfig } from "./types.ts";

const baseCategories: Category[] = [
  { key: "essential", label: "Essential", locked: true },
  { key: "analytics", label: "Analytics" },
  { key: "marketing", label: "Marketing" },
];

function makeConfig(overrides: Partial<OpenCookiesConfig> = {}): OpenCookiesConfig {
  return { categories: baseCategories, ...overrides };
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createConsentStore", () => {
  describe("initial state", () => {
    it("locked categories start true, others false", () => {
      const store = createConsentStore(makeConfig());
      expect(store.getState().decisions).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    it("decidedAt is null and route is 'cookie' by default", () => {
      const s = createConsentStore(makeConfig()).getState();
      expect(s.decidedAt).toBeNull();
      expect(s.route).toBe("cookie");
    });

    it("honors initialRoute config override", () => {
      const store = createConsentStore(makeConfig({ initialRoute: "closed" }));
      expect(store.getState().route).toBe("closed");
    });

    it("uses provided policyVersion or empty string", () => {
      expect(createConsentStore(makeConfig({ policyVersion: "v2" })).getState().policyVersion).toBe(
        "v2",
      );
      expect(createConsentStore(makeConfig()).getState().policyVersion).toBe("");
    });

    it("jurisdiction is null when no resolver is configured", () => {
      expect(createConsentStore(makeConfig()).getState().jurisdiction).toBeNull();
    });
  });

  describe("jurisdiction resolver", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("populates jurisdiction synchronously when resolver is sync", () => {
      const store = createConsentStore(makeConfig({ jurisdictionResolver: manualResolver("EEA") }));
      expect(store.getState().jurisdiction).toBe("EEA");
    });

    it("starts null and notifies subscribers when resolver is async", async () => {
      const resolver: JurisdictionResolver = {
        resolve: () => Promise.resolve("UK"),
      };
      const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
      expect(store.getState().jurisdiction).toBeNull();
      const listener = vi.fn();
      store.subscribe(listener);
      await flushMicrotasks();
      expect(store.getState().jurisdiction).toBe("UK");
      expect(listener).toHaveBeenCalledWith(store.getState());
    });

    it("forwards config.request to the resolver", () => {
      const resolve = vi.fn().mockReturnValue("US");
      const req = { headers: new Headers({ "cf-ipcountry": "US" }) };
      createConsentStore(makeConfig({ jurisdictionResolver: { resolve }, request: req }));
      expect(resolve).toHaveBeenCalledWith(req);
    });

    it("swallows sync resolver errors and leaves jurisdiction null", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const resolver: JurisdictionResolver = {
        resolve: () => {
          throw new Error("boom");
        },
      };
      const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
      expect(store.getState().jurisdiction).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    it("swallows async resolver rejections and leaves jurisdiction null", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const resolver: JurisdictionResolver = {
        resolve: () => Promise.reject(new Error("boom")),
      };
      const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
      await flushMicrotasks();
      expect(store.getState().jurisdiction).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    it("preserves jurisdiction across decision mutations", () => {
      const store = createConsentStore(makeConfig({ jurisdictionResolver: manualResolver("EEA") }));
      store.acceptAll();
      expect(store.getState().jurisdiction).toBe("EEA");
      store.acceptNecessary();
      expect(store.getState().jurisdiction).toBe("EEA");
      store.reject();
      expect(store.getState().jurisdiction).toBe("EEA");
      store.toggle("analytics");
      expect(store.getState().jurisdiction).toBe("EEA");
      store.save();
      expect(store.getState().jurisdiction).toBe("EEA");
    });
  });

  describe("refreshJurisdiction", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("re-invokes the resolver and commits the new value", async () => {
      let next: "EEA" | "US" = "EEA";
      const resolver: JurisdictionResolver = {
        resolve: () => next,
      };
      const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
      expect(store.getState().jurisdiction).toBe("EEA");
      next = "US";
      const result = await store.refreshJurisdiction();
      expect(result).toBe("US");
      expect(store.getState().jurisdiction).toBe("US");
    });

    it("notifies subscribers on refresh", async () => {
      let next: "EEA" | "UK" = "EEA";
      const store = createConsentStore(
        makeConfig({ jurisdictionResolver: { resolve: () => next } }),
      );
      const listener = vi.fn();
      store.subscribe(listener);
      next = "UK";
      await store.refreshJurisdiction();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]?.[0].jurisdiction).toBe("UK");
    });

    it("returns the current jurisdiction when no resolver is configured", async () => {
      const store = createConsentStore(makeConfig());
      const result = await store.refreshJurisdiction();
      expect(result).toBeNull();
    });

    it("forwards an explicit request override to the resolver", async () => {
      const resolve = vi.fn().mockReturnValue("EEA");
      const store = createConsentStore(makeConfig({ jurisdictionResolver: { resolve } }));
      resolve.mockClear();
      const req = { headers: new Headers({ "cf-ipcountry": "DE" }) };
      await store.refreshJurisdiction(req);
      expect(resolve).toHaveBeenCalledWith(req);
    });

    it("leaves jurisdiction unchanged when the resolver throws", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      let mode: "ok" | "boom" = "ok";
      const resolver: JurisdictionResolver = {
        resolve: () => {
          if (mode === "boom") throw new Error("nope");
          return "EEA";
        },
      };
      const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
      mode = "boom";
      const result = await store.refreshJurisdiction();
      expect(result).toBe("EEA");
      expect(store.getState().jurisdiction).toBe("EEA");
    });

    it("leaves jurisdiction unchanged when the resolver rejects", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      let mode: "ok" | "boom" = "ok";
      const resolver: JurisdictionResolver = {
        resolve: () =>
          mode === "boom" ? Promise.reject(new Error("nope")) : Promise.resolve("UK"),
      };
      const store = createConsentStore(makeConfig({ jurisdictionResolver: resolver }));
      await flushMicrotasks();
      expect(store.getState().jurisdiction).toBe("UK");
      mode = "boom";
      const result = await store.refreshJurisdiction();
      expect(result).toBe("UK");
      expect(store.getState().jurisdiction).toBe("UK");
    });
  });

  describe("acceptAll", () => {
    it("sets all decisions true, decidedAt, and closes route", () => {
      const store = createConsentStore(makeConfig());
      store.acceptAll();
      const s = store.getState();
      expect(s.decisions).toEqual({
        essential: true,
        analytics: true,
        marketing: true,
      });
      expect(s.route).toBe("closed");
      expect(s.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("acceptNecessary", () => {
    it("locked stays true, non-locked becomes false, route closes", () => {
      const store = createConsentStore(makeConfig());
      store.acceptAll();
      store.acceptNecessary();
      const s = store.getState();
      expect(s.decisions).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
      expect(s.route).toBe("closed");
      expect(s.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("reject", () => {
    it("matches acceptNecessary observable effect", () => {
      const a = createConsentStore(makeConfig());
      const b = createConsentStore(makeConfig());
      a.reject();
      b.acceptNecessary();
      expect(a.getState().decisions).toEqual(b.getState().decisions);
      expect(a.getState().route).toBe(b.getState().route);
    });
  });

  describe("toggle", () => {
    it("flips a non-locked category", () => {
      const store = createConsentStore(makeConfig());
      store.toggle("analytics");
      expect(store.getState().decisions.analytics).toBe(true);
      store.toggle("analytics");
      expect(store.getState().decisions.analytics).toBe(false);
    });

    it("is a no-op for locked categories", () => {
      const store = createConsentStore(makeConfig());
      const before = store.getState();
      store.toggle("essential");
      expect(store.getState()).toBe(before);
      expect(store.getState().decisions.essential).toBe(true);
    });

    it("is a no-op for unknown keys", () => {
      const store = createConsentStore(makeConfig());
      const before = store.getState();
      store.toggle("nope");
      expect(store.getState()).toBe(before);
    });

    it("does not set decidedAt", () => {
      const store = createConsentStore(makeConfig());
      store.toggle("analytics");
      expect(store.getState().decidedAt).toBeNull();
    });
  });

  describe("save", () => {
    it("sets decidedAt and closes route without touching decisions", () => {
      const store = createConsentStore(makeConfig());
      store.toggle("analytics");
      const decisionsBefore = store.getState().decisions;
      store.save();
      const s = store.getState();
      expect(s.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(s.route).toBe("closed");
      expect(s.decisions).toEqual(decisionsBefore);
    });
  });

  describe("setRoute", () => {
    it("changes the route", () => {
      const store = createConsentStore(makeConfig());
      store.setRoute("preferences");
      expect(store.getState().route).toBe("preferences");
    });

    it("does not touch decisions or decidedAt", () => {
      const store = createConsentStore(makeConfig());
      store.setRoute("preferences");
      const s = store.getState();
      expect(s.decidedAt).toBeNull();
      expect(s.decisions.analytics).toBe(false);
    });

    it("is a no-op when the route is unchanged", () => {
      const store = createConsentStore(makeConfig());
      const before = store.getState();
      store.setRoute("cookie");
      expect(store.getState()).toBe(before);
    });
  });

  describe("has", () => {
    it("returns true for locked categories on init", () => {
      expect(createConsentStore(makeConfig()).has("essential")).toBe(true);
    });

    it("returns false for non-locked categories on init", () => {
      expect(createConsentStore(makeConfig()).has("analytics")).toBe(false);
    });

    it("reflects toggles", () => {
      const store = createConsentStore(makeConfig());
      store.toggle("analytics");
      expect(store.has("analytics")).toBe(true);
    });

    it("throws on unknown keys by default", () => {
      expect(() => createConsentStore(makeConfig()).has("ghost")).toThrow();
    });
  });

  describe("subscribe", () => {
    it("notifies the listener with the new state on each transition", () => {
      const store = createConsentStore(makeConfig());
      const listener = vi.fn();
      store.subscribe(listener);
      store.acceptAll();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(store.getState());
    });

    it("returns an unsubscribe function", () => {
      const store = createConsentStore(makeConfig());
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.acceptAll();
      expect(listener).not.toHaveBeenCalled();
    });

    it("notifies multiple listeners", () => {
      const store = createConsentStore(makeConfig());
      const a = vi.fn();
      const b = vi.fn();
      store.subscribe(a);
      store.subscribe(b);
      store.toggle("analytics");
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });
  });

  describe("getState reference stability", () => {
    it("returns the same reference between mutations", () => {
      const store = createConsentStore(makeConfig());
      expect(store.getState()).toBe(store.getState());
    });

    it("returns a new reference after a mutation", () => {
      const store = createConsentStore(makeConfig());
      const before = store.getState();
      store.toggle("analytics");
      expect(store.getState()).not.toBe(before);
    });
  });
});
