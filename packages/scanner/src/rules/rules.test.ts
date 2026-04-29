import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixtures, partition } from "../test-helpers.ts";
import { parseFile } from "../parser.ts";
import { walk } from "../visit.ts";
import type { Rule } from "../types.ts";
import { cookiesNextRule } from "./cookies-next.ts";
import { jsCookieRule } from "./js-cookie.ts";
import { nextHeadersRule } from "./next-headers.ts";
import { reactCookieRule } from "./react-cookie.ts";
import { setCookieHeaderRule } from "./set-cookie-header.ts";

const RULES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "__fixtures__",
  "rules",
);

const cases: { name: string; rule: Rule }[] = [
  { name: "js-cookie", rule: jsCookieRule },
  { name: "cookies-next", rule: cookiesNextRule },
  { name: "react-cookie", rule: reactCookieRule },
  { name: "next-headers", rule: nextHeadersRule },
  { name: "set-cookie-header", rule: setCookieHeaderRule },
];

for (const { name, rule } of cases) {
  describe(`${name} rule`, () => {
    for (const fx of loadFixtures(join(RULES_DIR, name))) {
      it(fx.name, () => {
        const parsed = parseFile(fx.file, fx.source)!;
        const { hits } = walk(parsed, [rule], []);
        const got = partition(hits);
        expect(got.cookies).toHaveLength(fx.expected.cookies.length);
        for (let i = 0; i < fx.expected.cookies.length; i++) {
          expect(got.cookies[i]).toMatchObject(fx.expected.cookies[i]!);
        }
      });
    }
  });
}
