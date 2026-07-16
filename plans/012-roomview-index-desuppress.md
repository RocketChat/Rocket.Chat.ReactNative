# 012 — Make `RoomView/index.tsx` actually compile: remove its 3 exhaustive-deps suppressions with honest dep arrays

- **Status:** DONE `ea3601101`
- **Priority:** P1
- **Effort:** S
- **Risk:** Medium (whole-file compilation activates memoization across RoomView; mitigations below)
- **Planned at:** `2b37d2bd8`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. React 19 + **React Compiler** (`babel-plugin-react-compiler`, `compilationMode: 'annotation'` in `babel.config.js` — functions with a `'use memo'` directive get compiled, including under jest). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest, run `TZ=UTC pnpm test`.

**The problem:** `app/views/RoomView/index.tsx` carries `'use memo'` (line 70) but the compiler **silently skips the entire file** because it bails on any `// eslint-disable-next-line react-hooks/exhaustive-deps` comment inside an annotated function. There are exactly 3 (lines 147, 372, 377). Commit `34e17bf58` dropped manual `useCallback`s from this file trusting compilation that never happens, so RoomView currently runs with ZERO memoization — every render recreates every handler, which cascades into downstream effects keyed on those handlers.

**Verified facts (do not re-derive, but the contract test will re-verify):**

1. The compiler does NOT validate dep-array completeness — it only bails on the suppression comments. A copy of this file with the 3 comments stripped (dep arrays untouched) compiles cleanly under `panicThreshold: 'all_errors'`.
2. The repo's eslint (`react-hooks/exhaustive-deps`) does NOT flag _extra_ reactive dependencies — `useEffect(() => { fn(); }, [fn, roomUpdate])` with `roomUpdate` unused inside the body produces no warning. Missing deps DO warn, so the arrays below add what eslint requires while keeping the deliberate keying.
3. The compiled output of this file was audited for the mutable-model staleness class (the `room` object from the store is the SAME WatermelonDB model instance mutated in place; a paired `roomUpdate` snapshot subscription forces re-renders per emit): `hideSystemMessages`, the banner `bannerClosed`/`announcement` destructure, the `isInviteSubscription` branch condition, `federated`, and all `room.*` JSX props recompute every render or use property-level cache guards — safe. Two spots cache on the `room` ref: `getInvitationData(room)` and `getRoomTitle(room)` — both serve effectively static content and are ACCEPTED as-is; do not touch them.

**The guardrail that enforces this plan:** `app/views/RoomView/reactCompilerContract.test.ts` compiles every `'use memo'` file under RoomView with the real plugin and asserts the skipped set equals `KNOWN_SKIPPED`. This plan removes `app/views/RoomView/index.tsx` from that list — the test then FAILS if the file still doesn't compile, and fails if the entry is left in.

## Change

### 1. `app/views/RoomView/index.tsx` — three edits, nothing else

**Edit A (lines 146–148).** Current:

```tsx
// rid is stable for this RoomView instance (it's what roomStore was acquired for); release once on unmount.
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => () => releaseRoomStore(rid ?? ''), []);
```

Replace with:

```tsx
// rid is stable for this RoomView instance (it's what roomStore was acquired for); release once on unmount.
useEffect(() => () => releaseRoomStore(rid ?? ''), [rid]);
```

(`releaseRoomStore` is a module import — stable, eslint doesn't require it. `rid` is a route param, fixed for the life of this screen instance, so `[rid]` is behaviorally identical to `[]`.)

**Edits B and C (lines 348–378).** Both `setReadOnly` and `updateE2EEState` are called ONLY from their respective effects (verified — no other reference in the repo), so inline each body into its effect. This is required because eslint's `exhaustive-deps` flags an unmemoized function listed as a dep with "makes the dependencies change on every render" — a warning we must not add. `setState` is a `useReducer` dispatch (line 124) — eslint knows it's stable and does not require it in deps.

Current (lines 348–378):

```tsx
const setReadOnly = async () => {
	const readOnly = await isReadOnly(room as ISubscription, user.username as string);
	setState({ readOnly });
};

const updateE2EEState = () => {
	if (!('encrypted' in room)) {
		setState({ showMissingE2EEKey: false, showE2EEDisabledRoom: false });
		return;
	}
	const showMissingE2EEKey = isMissingRoomE2EEKey({
		encryptionEnabled,
		roomEncrypted: room.encrypted,
		E2EKey: room.E2EKey
	});
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({
		encryptionEnabled,
		roomEncrypted: room.encrypted
	});
	setState({ showMissingE2EEKey, showE2EEDisabledRoom });
};

useEffect(() => {
	setReadOnly();
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [roomUpdate]);

useEffect(() => {
	updateE2EEState();
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [encryptionEnabled, roomUpdate.encrypted, roomUpdate.E2EKey]);
```

Replace the whole block with:

```tsx
// roomUpdate keys the re-checks below: the room model mutates in place, so effects must re-run per store emit.
useEffect(() => {
	const setReadOnly = async () => {
		const readOnly = await isReadOnly(room as ISubscription, user.username as string);
		setState({ readOnly });
	};
	setReadOnly();
}, [room, user.username, roomUpdate]);

useEffect(() => {
	if (!('encrypted' in room)) {
		setState({ showMissingE2EEKey: false, showE2EEDisabledRoom: false });
		return;
	}
	const showMissingE2EEKey = isMissingRoomE2EEKey({
		encryptionEnabled,
		roomEncrypted: room.encrypted,
		E2EKey: room.E2EKey
	});
	const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({
		encryptionEnabled,
		roomEncrypted: room.encrypted
	});
	setState({ showMissingE2EEKey, showE2EEDisabledRoom });
}, [room, encryptionEnabled, roomUpdate.encrypted, roomUpdate.E2EKey]);
```

Behavior notes: `room` is the same stable model ref across emits and `user.username` effectively never changes, so effect B still fires per `roomUpdate` emit exactly as before; effect C keeps its original keys plus the stable `room` ref. The extra `roomUpdate` deps keep the deliberate per-emit keying and are eslint-clean per verified fact 2.

### 2. `app/views/RoomView/reactCompilerContract.test.ts`

Remove the `'app/views/RoomView/index.tsx'` entry (and its comment) from `KNOWN_SKIPPED`. Do not touch the other five entries.

## Scope

- **In scope:** the two files above, exactly the edits above.
- **Out of scope — do not touch:** the other 5 skipped files (`useRoomLifecycle.ts`, `useOmnichannelPermissions.ts`, `useScroll.ts`, `useJumpToMessage.ts`, `useRoomNavigation.ts` — separate follow-up plans), `getInvitationData`/`getRoomTitle` call sites (accepted caches), any other line of `index.tsx`, `babel.config.js`, eslint config.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='reactCompilerContract'` → passes: `index.tsx` now compiles in the clean set (this is the plan's own ratchet — if it fails naming `index.tsx`, the file still doesn't compile: STOP and report the compiler error).
2. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → **exactly** `✖ 180 problems (0 errors, 180 warnings)`. If any of the three edited effects produces a new exhaustive-deps warning, STOP and report the exact warning text — do not add a suppression back, do not reshuffle deps beyond this plan.
3. `npx tsc` → exit 0, no output. (Plain `pnpm lint` may fail in a nested worktree — environment quirk; use the split commands.)
4. `TZ=UTC pnpm test` → full suite passes, no snapshot churn. NOTE: compiling this file changes runtime memoization for every RoomView test that renders it — a previously-passing test that now fails is a REAL signal; STOP and report it, do not "fix" the test.
5. `git diff --stat` → exactly the 2 in-scope files.

## Test plan

The contract test's ratchet IS the compile-level regression test. Behavior coverage comes from the existing RoomView suites in the full run (done criterion 4).

## Maintenance note

Never add `// eslint-disable-next-line react-hooks/exhaustive-deps` inside a `'use memo'` function — it silently disables compilation of the whole function; the contract test now enforces this for `index.tsx`. The "extra reactive dep for keying" pattern (`[fn, roomUpdate]`) is the sanctioned way to keep mutable-model re-checks honest.

## Escape hatches

- Done criteria 1, 2, 4 each carry an explicit STOP condition above.
- If `index.tsx` at your checkout differs from the excerpts (drift), STOP and report — do not adapt.
- Do not wait passively on background tasks — run all verification in the foreground and report results.
