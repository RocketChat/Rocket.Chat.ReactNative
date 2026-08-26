# anti-slop

Vendored Oxlint plugin. Upstream: https://github.com/dmmulroy/anti-slop

## Local deviations

- `no-module-mocking`'s doc comment is reworded — its upstream wording uses a term this repo bans.
- Upstream's `effect/` rules are not vendored — this app has no direct `effect` dependency.
- `no-unknown-parameters`, `no-unknown-returns` and `no-runtime-typeof` were removed. `unknown`
  parameters and `typeof` narrowing are used deliberately across our repos.
- `no-chained-type-assertions` and `no-unsafe-dictionary-type` run as warnings. Their remaining
  findings need real parsing at the server-payload boundary, not a lint fix.
- `no-module-mocking` and `require-safety-comment-for-type-assertion` also run as warnings. Both
  fire mostly in tests, where module mocking and asserted fixtures are the intended style.

## Constraints

This directory is not app source. It uses `.ts` import specifiers, so it is excluded from
`tsconfig.json` and from `.oxfmtrc.json`. Do not lint, format or typecheck it as app code.

`@oxlint/plugins` and `oxlint` versions must stay matched.
