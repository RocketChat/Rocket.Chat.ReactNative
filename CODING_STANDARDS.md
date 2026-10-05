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

## Comments

Code carries its own meaning. Names and structure say what a comment would.

- Rewrite instead of annotate: when a line seems to need a comment, rename the variable, extract a function, or simplify the branch until it doesn't.
- Keep only what code cannot say: license headers, required pragmas (`eslint-disable`, `@ts-expect-error`), and a link to an upstream issue that explains a workaround.
- This outranks "consistency beats preference". Commented files nearby are not licence to add more.
- Before calling any edit done, re-read the diff and confirm every added line is code.
- If you still need to write a comment, write it in way it doesn't get outdated easily. e.g. "it used to do this" is not a good comment.

## Tests

New test files go in a `__tests__/` folder beside the source, named `*.test.ts(x)`. Existing co-located tests stay where they are until their source is otherwise touched.

- Tautological tests considered harmful.
- No test-only code inside non-test-only files.
