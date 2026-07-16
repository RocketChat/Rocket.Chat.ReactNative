# 009 — Guard overlapping omnichannel-permission fetches against out-of-order resolution

- **Status:** TODO
- **Priority:** P2
- **Effort:** S
- **Risk:** Low (effect-scoped cancellation flag; happy path unchanged)
- **Planned at:** `482f2c5a6`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Zustand, React 19 + React Compiler (`'use memo'`). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest + `@testing-library/react-native`, run `TZ=UTC pnpm test`. Never use `any` in new source code (existing test fixtures in this repo sometimes cast room objects `as any` — matching that fixture idiom in the test file is acceptable, but do not add `any` to the hook itself).

**The bug (pre-existing, faithfully ported from the old class component):** `app/views/RoomView/hooks/useOmnichannelPermissions.ts` refreshes four livechat permission flags into a zustand room store. The effect (lines 66-71) re-fires whenever `roomUpdate.lastMessage?.token`, `roomUpdate.visitor`, `roomUpdate.status`, or `joined` changes, and each firing calls `updateOmnichannel()` — an unawaited async that runs a `Promise.all` of three network calls and then unconditionally `roomStore.setState(...)`. Two triggers in quick succession (e.g. a livechat status change followed by a `joined` flip) start two overlapping batches; if the FIRST batch resolves LAST, its stale flags overwrite the fresher ones and the wrong state sticks until the next trigger. There is also no unmount guard.

Current code (`app/views/RoomView/hooks/useOmnichannelPermissions.ts:55-72`):

```ts
const updateOmnichannel = async () => {
	const [canForwardGuest, canReturnQueue, canViewCannedResponse] = await Promise.all([
		getCanForwardGuest(),
		getCanReturnQueue(),
		getCanViewCannedResponse()
	]);
	const canPlaceLivechatOnHold = getCanPlaceLivechatOnHold();
	roomStore.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
};

// If it's a livechat room
useEffect(() => {
	if (t === 'l') {
		updateOmnichannel();
	}
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [roomUpdate.lastMessage?.token, roomUpdate.visitor, roomUpdate.status, joined]);
```

**The fix:** effect-scoped cancellation. Each effect run owns a `cancelled` flag; the cleanup (which React runs before the next effect firing AND on unmount) sets it; the async batch checks it after the `Promise.all` and skips `setState` when a newer run has superseded it. This makes "last trigger wins" deterministic.

## Change

Only two files. Keep Prettier style (tabs, 130 width).

1. **`app/views/RoomView/hooks/useOmnichannelPermissions.ts`**

   - Change `updateOmnichannel` to accept a cancellation getter and bail before writing:
     ```ts
     const updateOmnichannel = async (isCancelled: () => boolean) => {
     	const [canForwardGuest, canReturnQueue, canViewCannedResponse] = await Promise.all([
     		getCanForwardGuest(),
     		getCanReturnQueue(),
     		getCanViewCannedResponse()
     	]);
     	if (isCancelled()) {
     		return;
     	}
     	const canPlaceLivechatOnHold = getCanPlaceLivechatOnHold();
     	roomStore.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
     };
     ```
   - Rewrite the effect so each run cancels its predecessor (keep the `// If it's a livechat room` comment and the eslint-disable line and the exact same dependency array):
     ```ts
     // If it's a livechat room
     useEffect(() => {
     	if (t !== 'l') {
     		return;
     	}
     	let cancelled = false;
     	updateOmnichannel(() => cancelled);
     	return () => {
     		cancelled = true;
     	};
     	// eslint-disable-next-line react-hooks/exhaustive-deps
     }, [roomUpdate.lastMessage?.token, roomUpdate.visitor, roomUpdate.status, joined]);
     ```
     Note the eslint-disable comment must sit directly above the dependency array line (same placement as today) or the `react-hooks/exhaustive-deps` warning fires.

2. **`app/views/RoomView/hooks/useOmnichannelPermissions.test.tsx`** — add ONE regression test to the existing `describe` block. Follow the file's existing helpers (`makeRoomStore`, mocks at top). The test proves a superseded batch cannot overwrite a fresher one:
   - Use `renderHook` directly (not the `renderOmnichannelPermissions` helper) with `initialProps` so you can `rerender` with a changed `joined` value — the pattern used across this repo's hook suites is `renderHook((props) => useOmnichannelPermissions(props), { initialProps: firstProps })` then `rerender(secondProps)`.
   - First render (run 1): `mockHasPermission.mockResolvedValue([false])`, and `mockGetRoutingConfig` returns a MANUALLY controlled promise you capture the resolver of (`new Promise(resolve => { resolveFirstRoutingConfig = resolve; })`, `mockImplementationOnce`). This keeps run 1's whole `Promise.all` pending.
   - Before rerendering, switch the mocks for run 2: `mockHasPermission.mockResolvedValue([true])` and `mockGetRoutingConfig.mockResolvedValue({ returnQueue: true })`.
   - `rerender` with `joined` flipped (dep change → effect re-fires → run 1's cleanup sets its `cancelled` flag).
   - `await waitFor(() => expect(roomStore.getState().canForwardGuest).toBe(true))` — run 2 landed.
   - Now resolve run 1: `resolveFirstRoutingConfig({ returnQueue: false })`, flush microtasks (`await act(async () => {})`).
   - Assert the store still holds run 2's values: `canForwardGuest === true`, `canReturnQueue === true`, `canViewCannedResponse === true`. (Without the fix, run 1's late `setState` flips them back to `false` — verify the test actually fails if you temporarily revert the hook change, then re-apply.)
   - Both renders use `t: 'l'` and the same `roomStore` instance (create it once with `makeRoomStore()` and pass it in props).

## Scope

- **In scope:** `app/views/RoomView/hooks/useOmnichannelPermissions.ts`, `app/views/RoomView/hooks/useOmnichannelPermissions.test.tsx`.
- **Out of scope — do not touch:** `RoomStore.ts`, `RoomView/index.tsx`, any other hook or store, the two existing tests in the test file (they must pass unmodified).

## Verification / done criteria

1. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → 0 errors (180 pre-existing warnings expected) AND `npx tsc` → exit 0, no output. (Plain `pnpm lint` may fail in a nested worktree with a "couldn't determine the plugin import uniquely" error — environment quirk, use the split commands.)
2. `TZ=UTC pnpm test --testPathPattern='useOmnichannelPermissions'` → all 3 tests pass (2 existing + 1 new).
3. Revert-check performed: with the hook change temporarily reverted the new test FAILS; re-applied it passes. State this explicitly in your report.
4. `TZ=UTC pnpm test` → full suite passes, no snapshot churn.
5. `git diff --stat` shows only the 2 in-scope files.

## Test plan

The new race regression test in step 2 is the test plan. The two existing tests characterize the happy path and the non-livechat no-op and must stay green unmodified.

## Maintenance note

Any future async work inside this hook (or new effect-triggered fetch batches in other RoomView hooks) needs the same effect-scoped cancellation so "last trigger wins" stays deterministic. The cleanup doubles as the unmount guard.

## Escape hatches

- If the new test cannot be made deterministic with manually controlled promises (flaky under `waitFor`), STOP and report the exact failure mode instead of adding timeouts/sleeps.
- If eslint complains about the moved eslint-disable comment placement, match whatever placement silences `react-hooks/exhaustive-deps` without disabling additional rules; if that proves impossible, STOP and report.
- Do not wait passively on background tasks — run all verification in the foreground and report results.
