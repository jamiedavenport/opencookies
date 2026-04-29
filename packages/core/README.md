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

## License

Apache-2.0
