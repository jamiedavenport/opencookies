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

## License

Apache-2.0
