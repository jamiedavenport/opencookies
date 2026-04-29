# @opencookies/core

Framework-agnostic consent store for OpenCookies. Owns consent state and broadcasts changes to subscribers via a small pub/sub interface that each framework adapter wraps in its own reactivity primitive.

> Status: scaffold. API lands in [OP-295](https://linear.app/open-policy/issue/OP-295).

## Install

```sh
bun add @opencookies/core
```

## Jurisdiction

A `JurisdictionResolver` tells the store which region the visitor is in, so banner defaults can vary (opt-in for EEA/UK, opt-out for US, and so on). The resolved jurisdiction is stored on the consent record and persists across decision changes.

```ts
import { createConsentStore, headerResolver } from "@opencookies/core";

// Edge runtime (Cloudflare, Vercel, Netlify): read country from request headers.
const store = createConsentStore({
  categories,
  jurisdictionResolver: headerResolver(),
  request, // standard Request, or anything with a Headers instance
});
```

Three resolvers ship in v1:

- `headerResolver()` reads `cf-ipcountry`, `x-vercel-ip-country`, or `x-country` and normalises the country to a `Jurisdiction`.
- `manualResolver(jurisdiction)` returns a fixed value — useful for tests and SSR overrides.
- `clientGeoResolver({ endpoint })` `fetch`es a developer-provided endpoint that returns `{ country, region? }`. No IP database is bundled.

Call `store.refreshJurisdiction(req?)` to re-resolve (e.g. after client-side navigation in an SSR app). The resolver is otherwise called once per session and cached.

### Custom resolver

Implement the `JurisdictionResolver` interface and reuse `countryToJurisdiction` for normalisation:

```ts
import { type JurisdictionResolver, countryToJurisdiction } from "@opencookies/core";

export function ipApiResolver(): JurisdictionResolver {
  return {
    async resolve() {
      const res = await fetch("https://ipapi.co/json/");
      const { country_code } = await res.json();
      return countryToJurisdiction(country_code);
    },
  };
}
```

## Global Privacy Control

[Global Privacy Control](https://globalprivacycontrol.org/) (GPC) is a browser signal asserting "do not sell or share". It is legally enforceable under California's CPRA and the consumer-privacy laws of Colorado, Connecticut, Virginia, and others.

When GPC is asserted, the store treats opt-out categories as denied without prompting, sets `source: "gpc"` on the consent record, and closes the banner if there is nothing left to ask.

The privacy-positive default applies GPC in every jurisdiction with no extra config:

```ts
import { createConsentStore } from "@opencookies/core";

const store = createConsentStore({ categories });
// Brave (and any browser asserting GPC) sees the banner skipped automatically.
```

To scope GPC to the legally-required US states only:

```ts
import { GPC_LEGALLY_REQUIRED_JURISDICTIONS, createConsentStore } from "@opencookies/core";

const store = createConsentStore({
  categories,
  gpc: { applicableJurisdictions: GPC_LEGALLY_REQUIRED_JURISDICTIONS },
});
```

A category that should ignore GPC sets `respectGPC: false`:

```ts
const categories = [
  { key: "essential", label: "Essential", locked: true },
  { key: "analytics", label: "Analytics", respectGPC: false },
  { key: "marketing", label: "Marketing" },
];
```

To disable GPC handling entirely (e.g. you want to display GPC status yourself):

```ts
createConsentStore({ categories, gpc: { enabled: false } });
```

`state.source` is `"default"` before any decision, `"gpc"` after GPC applies, and `"user"` once the visitor takes any action. Persist this alongside the decisions to keep "the browser said no" distinct from "the user said no" later.

## Consent records

When a decision is persisted via a `StorageAdapter`, the store serialises it as a versioned `ConsentRecord`:

```ts
type ConsentRecord = {
  schemaVersion: 1;
  decisions: Record<string, boolean>;
  policyVersion: string;
  decidedAt: string; // ISO-8601
  jurisdiction: Jurisdiction | null;
  locale: string;
  source: "banner" | "preferences" | "api" | "import";
};
```

`source` records _where_ the decision came from, separately from `state.source`:

- `"banner"` — accepted/rejected from the cookie banner.
- `"preferences"` — changed inside the preferences UI.
- `"api"` — set via a programmatic call (override with `acceptAll({ source: "api" })`, etc.).
- `"import"` — migrated from a legacy or unrecognised record.

The store infers `source` from `state.route` at the moment the decision is taken; pass `{ source }` to any action to override it.

Read the current record via `store.getConsentRecord()` (or the binding-level `useConsent().getConsentRecord()`). It returns `null` until a decision has been recorded.

```ts
const store = createConsentStore({
  categories,
  locale: "en-GB", // optional; falls back to navigator.language, then "en"
  adapter: cookieAdapter(),
});

store.acceptAll();
store.getConsentRecord();
// {
//   schemaVersion: 1,
//   decisions: { essential: true, analytics: true, marketing: true },
//   policyVersion: "",
//   decidedAt: "2026-04-29T12:34:56.000Z",
//   jurisdiction: "EEA",
//   locale: "en-GB",
//   source: "banner",
// }
```

Records produced by older versions of OpenCookies are tolerated on read: missing fields fall back to safe defaults, the legacy `source: "user"` flag is mapped to `"banner"`, and any other unrecognised legacy source becomes `"import"`. The next user decision rewrites the record in the v1 shape.

GPC alone does not produce a record — the visitor has not made a decision. `getConsentRecord()` keeps returning `null` until the user accepts, rejects, saves, or toggles a category.

## Re-consent triggers

A stored `ConsentRecord` can become stale: the cookie policy is updated, a new category appears, the visitor moves to a different jurisdiction, or the record simply ages out. Pass a `triggers` config to declare when the store should re-prompt instead of restoring stored decisions.

```ts
const store = createConsentStore({
  categories,
  policyVersion: "v2",
  adapter: cookieAdapter(),
  triggers: {
    policyVersionChanged: true, // config.policyVersion !== record.policyVersion
    categoriesAdded: true, // a category in config is missing from the record
    expiresAfter: "13 months", // older than the duration → re-prompt
    jurisdictionChanged: true, // current jurisdiction differs from the recorded one
  },
});
```

`expiresAfter` accepts:

- a number of milliseconds (`60_000`);
- a human-friendly string (`"13 months"`, `"30 days"`, `"1 year"`, `"24h"`, `"90s"`);
- an ISO 8601 duration (`"P13M"`, `"P1Y"`, `"PT24H"`);
- `null` or omitted to never expire.

When any trigger fires, the store invalidates state — `route` returns to `"cookie"`, `decidedAt` is cleared, decisions reset to defaults — and exposes the original record on `state.repromptReason` and `store.getPreviousRecord()`:

```ts
const { repromptReason, getPreviousRecord } = useConsent();

if (repromptReason !== null) {
  console.log(`Re-prompting because: ${repromptReason}`);
  console.log("Previous decisions:", getPreviousRecord()?.decisions);
}
```

`repromptReason` is one of `"policyVersion" | "categoriesAdded" | "expired" | "jurisdiction"`, in priority order — the first trigger to fire wins. Once the visitor makes a new decision (`acceptAll`, `acceptNecessary`, `reject`, or `save`), `repromptReason` clears, `getPreviousRecord()` returns `null`, and a fresh record is written via the adapter.

For analytics, the store emits an `oncookies:reprompt` event on `globalThis` whenever a trigger fires, with `event.detail.reason` containing the trigger name:

```ts
globalThis.addEventListener("oncookies:reprompt", (event) => {
  analytics.track("consent_reprompt", { reason: event.detail.reason });
});
```

## Script gating

Third-party tag scripts (GA4, Meta Pixel, PostHog, …) need to be loaded _only_ after the visitor consents to the matching category — but typical site code calls `window.gtag(…)` from the moment the page boots. `gateScript` solves that gap: it injects the `<script>` tag once consent is granted, intercepts pre-consent calls to listed window globals, and replays them after the script and `init` have run.

```ts
import { createConsentStore, defineScript, gateScript } from "@opencookies/core";

const store = createConsentStore({ categories });

const ga4 = defineScript({
  id: "ga4",
  requires: "analytics",
  src: "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX",
  queue: ["dataLayer.push"],
  init: () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", "G-XXXXXXX");
  },
});

gateScript(store, ga4);
```

`gateScript` is a free function (rather than a method on the store) so unused script-gating code is tree-shaken out of bundles that never import it. `defineScript` is a pure identity function; pair it with the snippet above for type-narrowing without dragging in the runtime.

Useful options on the script definition:

- `requires` is a `ConsentExpr` — same shape as `store.has`. Combine with `{ and: ["analytics", "marketing"] }` for scripts that need multiple categories.
- `queue` lists window paths to intercept while gated. Dotted paths like `dataLayer.push` walk into existing objects (or create them — `dataLayer` defaults to an array). Pre-consent calls to `*.push` / `*.unshift` are mirrored into the underlying array immediately so a script that reads the buffer on load sees the same history.
- `attrs` adds attributes to the injected `<script>` tag (e.g. `crossorigin`, `nonce`, `integrity`).

`gateScript` returns a `dispose()`. While the script is still gated, `dispose()` removes the queue stubs and unsubscribes from the store. Once the script has loaded, `dispose()` is a no-op — see _No auto-revoke_ below.

### No auto-revoke

A loaded script cannot be un-loaded. If consent is later revoked, OpenCookies does **not** unmount the `<script>` tag, restore the queue stubs, or re-evaluate the gate. Recommend `location.reload()` to your users for a clean slate.

For inline JSX gating (e.g. wrapping a `<MapWidget />` in a marketing-consent gate) the framework adapters expose `<ConsentGate>` with the same `requires` expression shape.

## License

Apache-2.0
