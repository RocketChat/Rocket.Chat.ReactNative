# 011 — Compilation-contract test: fail loudly when a `'use memo'` file is silently skipped by the React Compiler

- **Status:** TODO
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (one new test file, no source changes)
- **Planned at:** `8f7bb242c`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. React 19 + **React Compiler**: `babel.config.js` registers `babel-plugin-react-compiler` with `compilationMode: 'annotation'` — only functions carrying a `'use memo'` directive are compiled. Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest, run `TZ=UTC pnpm test`.

**The problem:** the compiler **silently skips** an annotated function when it finds a rules-of-React violation — most commonly an `// eslint-disable-next-line react-hooks/exhaustive-deps` suppression inside the function body. No build error, no warning in this repo's pipeline (there is no `eslint-plugin-react-compiler` configured). The annotation then lies: the code LOOKS compiled but runs with zero memoization.

This is not hypothetical. Verified against the real plugin (`panicThreshold: 'all_errors'` makes skips throw), these SIX annotated units under `app/views/RoomView/` are silently skipped today:

- `app/views/RoomView/index.tsx` — 3 `react-hooks/exhaustive-deps` suppressions; the branch dropped manual `useCallback`s relying on compilation that never happens
- `app/views/RoomView/hooks/useRoomLifecycle.ts` — 3 exhaustive-deps suppressions
- `app/views/RoomView/hooks/useOmnichannelPermissions.ts` — 1 exhaustive-deps suppression
- `app/views/RoomView/List/hooks/useScroll.ts` — 2 exhaustive-deps suppressions
- `app/views/RoomView/hooks/useJumpToMessage.ts` — compiler limitation: `Todo: Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement`
- `app/views/RoomView/hooks/useRoomNavigation.ts` — `Cannot access refs during render`: the debounce factory inside `useMemo` closes over a ref read during render

Fixing those root causes is separate follow-up work. THIS plan adds the guardrail: a jest test that compiles every `'use memo'` file under `app/views/RoomView/` with the real plugin and asserts that the set of skipped files exactly equals a known-skipped list. Fixing a file forces removing it from the list (ratchet down); introducing a new silent skip fails the test immediately.

## Change

One new file: `app/views/RoomView/reactCompilerContract.test.ts`.

Implementation requirements:

1. **Collect files:** recursively walk `app/views/RoomView/` (use `fs.readdirSync(dir, { recursive: true })` or a manual walk) for `.ts`/`.tsx` files (skip `.test.` files and `__snapshots__`) whose content includes `'use memo'`.
2. **Compile each with the real plugin.** Resolve the test's path to the repo root via `path.resolve(__dirname, '../../..')` — verify that lands on the directory containing `babel.config.js`. Use this transform (verified to work in this repo — `@babel/preset-typescript` and `@babel/preset-react` resolve from the repo root):

```ts
import { transformFileSync } from '@babel/core';

const compile = (file: string) =>
	transformFileSync(file, {
		babelrc: false,
		configFile: false,
		presets: [
			['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
			['@babel/preset-react', { runtime: 'automatic' }]
		],
		plugins: [['babel-plugin-react-compiler', { compilationMode: 'annotation', panicThreshold: 'all_errors' }]]
	});
```

With `panicThreshold: 'all_errors'`, any annotated function the compiler would skip throws instead. A file compiles cleanly ⇔ `compile(file)` doesn't throw. (Successful compilation also imports `react/compiler-runtime` in the output — you may additionally assert that, but the no-throw check is the contract.) 3. **The contract:** maintain a `KNOWN_SKIPPED` array with exactly the six relative paths listed above, each with a one-line comment giving its ACTUAL reason (exhaustive-deps suppressions for the first four; the compiler try/catch limitation and the ref-during-render error respectively for the last two). Two assertions:

- every file NOT in `KNOWN_SKIPPED` compiles without throwing (on failure, include the file path and the compiler's error message in the assertion message);
- every file IN `KNOWN_SKIPPED` still throws (so a fixed file must be removed from the list — the ratchet).

4. Keep it ONE `describe` with clear test names. Use `test.each` or a loop — your choice, but a failure must name the offending file.

## Scope

- **In scope:** `app/views/RoomView/reactCompilerContract.test.ts` (new file only).
- **Out of scope — do not touch:** any source file, `babel.config.js`, eslint config, the four skipped files themselves (fixing their suppressions is separate follow-up work), anything outside `app/views/RoomView/`.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='reactCompilerContract'` → passes, and reports a sensible count (there are roughly a dozen `'use memo'` files under `app/views/RoomView/`).
2. Ratchet check both ways (report both):
   - temporarily add `// eslint-disable-next-line react-hooks/exhaustive-deps` above a hook dep array in a currently-clean compiled file (e.g. `app/views/RoomView/components/MessageRow.tsx` if it has an effect, otherwise any clean annotated file with a hook — if none has a suitable hook, add a temporary trivial `useEffect` for the check) → test FAILS naming that file. Revert.
   - temporarily remove one entry from `KNOWN_SKIPPED` → test FAILS (the file still throws but isn't listed). Revert.
3. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → 0 errors (180 pre-existing warnings expected) AND `npx tsc` → exit 0. (Plain `pnpm lint` may fail in a nested worktree — environment quirk, use the split commands.)
4. `TZ=UTC pnpm test` → full suite passes. Watch runtime: the contract test should stay under ~30s; if it's slower, note the timing in your report.
5. `git diff --stat` shows only the 1 new file.

## Test plan

This plan IS a test. The ratchet checks in done-criterion 2 are its own regression proof.

## Maintenance note

When follow-up work fixes the root cause in one of the six skipped files, that file must also be removed from `KNOWN_SKIPPED` — the test enforces this. If someone annotates a new RoomView file with `'use memo'`, it is automatically covered. Widening the walk beyond `app/views/RoomView/` (app-wide) is a deliberate future step — it would surface skips in code this branch doesn't own.

## Escape hatches

- If `@babel/preset-typescript` / `@babel/preset-react` / `@babel/core` fail to resolve from the test (pnpm layout), try `require.resolve(<name>, { paths: [repoRoot] })`; if that also fails, STOP and report the resolution error.
- If any RoomView file fails the transform for a reason UNRELATED to the compiler (e.g. syntax the minimal preset pipeline can't parse, like legacy decorators), STOP and report the file + error — do not silently add it to `KNOWN_SKIPPED`.
- If the test exceeds ~60s, STOP and report the timing instead of shipping a slow suite.
- Do not wait passively on background tasks — run all verification in the foreground and report results.
