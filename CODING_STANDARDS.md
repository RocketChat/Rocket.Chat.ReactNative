# Coding Standards

Rules a reviewer checks that tooling does not block. Formatting and lint errors are CI's job; flag these.

## JSX props

Pass every prop explicitly: `<Avatar text={text} size={size} />`. Spread props (`{...props}`) in JSX are a violation, even when forwarding.

## Complexity

`.oxlintrc.json` sets these as **warnings**, so they never fail a build. Treat a new or worsened warning in the diff as a finding:

- `complexity/complexity` (`oxlint-plugin-complexity`): cognitive complexity ≤ 15 per function.
- `complexity`: cyclomatic ≤ 20.
- `max-params`: ≤ 4 parameters; group the rest into an object.

Test files are exempt. List the warnings for changed files with `pnpm exec oxlint <files>`.

## Tests

New test files go in a `__tests__/` folder beside the source, named `*.test.ts(x)`. Existing co-located tests stay where they are until their source is otherwise touched.
