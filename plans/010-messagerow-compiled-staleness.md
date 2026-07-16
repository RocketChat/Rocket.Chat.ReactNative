# 010 — Fix MessageRow stale `isIgnored`/badge under React Compiler + kill per-message row fan-out

- **Status:** TODO
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (one component + one new test; derived values move into zustand selectors)
- **Planned at:** `8f7bb242c`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Zustand, React 19 + **React Compiler** (`babel-plugin-react-compiler`, `compilationMode: 'annotation'` in `babel.config.js` — any function with a `'use memo'` directive gets compiled, including under jest, since babel-jest uses the same config). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest + `@testing-library/react-native`, run `TZ=UTC pnpm test`. Never use `any` in source code (test fixtures may cast `as any`, matching existing test idiom).

**Background — the mutable-model re-render pattern:** `app/views/RoomView/stores/RoomStore.ts` observes a WatermelonDB Subscription. WatermelonDB re-emits the SAME mutated model instance when tracked columns change, so zustand selectors on the `room` object never re-fire (same reference). The store therefore also sets `roomUpdate` — a fresh snapshot object per emit — and `useRoomWithUpdate()` in `app/views/RoomView/stores/RoomStoreContext.tsx` pairs both subscriptions to force a re-render.

**The bug:** `app/views/RoomView/components/MessageRow.tsx` has `'use memo'` (line 24) and uses `useRoomWithUpdate()` (line 26). The pairing DOES re-render the component per emit — but the React Compiler caches every derived value on the **`room` reference**, which never changes. Compiled output (verified against the real babel plugin):

```js
if ($[2] !== room) {            // isIgnored closure — room ref never changes → never busts
  t2 = message => { ... room?.ignored?.includes?.(message?.u?._id) ... };
  ...
if ($[22] !== isIgnored || $[23] !== item) {   // isIgnored(item) result — cached forever
  t3 = isIgnored(item);
  ...
if ($[25] !== room || $[26] !== t4 || $[27] !== theme) {   // getBadgeColor — cached forever
  t5 = getBadgeColor({ subscription: room, theme, messageId: t4 });
```

Net effect: when a user ignores/unignores someone, or a thread-unread badge changes, the mutated-in-place `room` keeps the same ref, the compiler serves the cached `isIgnored`/`threadBadgeColor`, and `<Message>` receives stale props **despite the re-render**. The existing regression tests in `RoomStoreContext.test.tsx` pass only because their inline `Probe` components have no `'use memo'` and aren't compiled.

Secondary effect: `useRoomWithUpdate()` makes every mounted row (~15–20) re-render on ALL 29 tracked column changes — including `lastMessage`, i.e. every incoming message — for nothing (the compiler cache means the re-render can't even deliver fresh values).

**The fix:** compute the derived values INSIDE zustand selectors that return primitives. Selectors re-run on every store notification (each WatermelonDB emit calls `setState`, which notifies all listeners) and read the mutable model's getters fresh at that moment; the component only re-renders when the selected primitive actually changes. This fixes both staleness (fresh reads) and fan-out (primitive equality).

## Current code

`app/views/RoomView/components/MessageRow.tsx` lines 23–37 and 92–103:

```tsx
export const MessageRow = ({ item, previousItem, highlightedMessage, onLongPress }: TMessageRowProps) => {
	'use memo';

	const room = useRoomWithUpdate();
	const lastOpen = useRoomStore(s => s.lastOpen);
	const { theme } = useTheme();
	const inAppFeedbackForItem = useSelector((state: IApplicationState) => state.inAppFeedback?.[item.id]);
	const dispatch = useDispatch();

	const isIgnored = (message: TAnyMessageModel): boolean => {
		if ('id' in room) {
			return room?.ignored?.includes?.(message?.u?._id) ?? false;
		}
		return false;
	};
	...
			<Message
				item={item}
				isIgnored={isIgnored(item)}
				...
				threadBadgeColor={getBadgeColor({ subscription: room, theme, messageId: item?.id })}
```

## Change

### 1. `app/views/RoomView/components/MessageRow.tsx`

- Replace the `useRoomWithUpdate()` call with `useRoomStore(s => s.room)` and remove `useRoomWithUpdate` from the import (keep `useRoomStore`).
- Move the `useTheme()` call ABOVE the new selectors (they need `theme`).
- Replace the local `isIgnored` function with two selector-derived values. Target top of component:

```tsx
export const MessageRow = ({ item, previousItem, highlightedMessage, onLongPress }: TMessageRowProps) => {
	'use memo';

	const { theme } = useTheme();
	const room = useRoomStore(s => s.room);
	const lastOpen = useRoomStore(s => s.lastOpen);
	// The room model mutates in place (same ref per emit), and the React Compiler caches derived
	// values on that stable ref. Deriving primitives inside selectors keeps them fresh per emit
	// and only re-renders the row when the derived value actually changes.
	const isIgnored = useRoomStore(s => ('id' in s.room ? (s.room.ignored?.includes?.(item?.u?._id) ?? false) : false));
	const threadBadgeColor = useRoomStore(s => getBadgeColor({ subscription: s.room, theme, messageId: item.id }));
	const inAppFeedbackForItem = useSelector((state: IApplicationState) => state.inAppFeedback?.[item.id]);
	const dispatch = useDispatch();
```

- In the `<Message>` JSX, pass the derived values directly: `isIgnored={isIgnored}` and `threadBadgeColor={threadBadgeColor}`.
- `room` stays for the `LoadMore` branch (`room.rid`, `room.t`) — those reads are compiled with property-level cache guards (`$[x] !== room.rid`), which read fresh at compare time, and are effectively immutable anyway.
- `TAnyMessageModel` may become an unused import once the local `isIgnored` function is gone — it's still used by `TMessageRowProps`, so it stays. Remove nothing else.

If `'id' in s.room` doesn't narrow enough for `.ignored` to type-check, mirror however the current function body satisfies tsc (it uses the same `'id' in room` guard + optional chaining) — do NOT cast.

### 2. New test `app/views/RoomView/components/MessageRow.test.tsx`

**The point of this test is that `MessageRow` itself is COMPILED under jest** (it has `'use memo'`), so it exercises the compiler-cache behavior the inline Probes in `RoomStoreContext.test.tsx` cannot. Follow that file's setup pattern (`app/views/RoomView/stores/RoomStoreContext.test.tsx` — read it first): same `jest.mock` set for `../../../lib/database`, `../services` → adjust relative paths from `components/` (they resolve identically: both dirs sit one level under `RoomView/`), same `setupObserve` helper capturing the observable's `emit`, same `getOrCreateRoomStore` + `__resetRoomStoreRegistryForTests`.

Additional mocks this component needs:

```tsx
jest.mock('react-redux', () => ({
	useSelector: jest.fn(() => undefined),
	useDispatch: () => jest.fn()
}));
const mockMessage = jest.fn();
jest.mock('../../../containers/message', () => ({
	__esModule: true,
	default: (props: unknown) => {
		mockMessage(props);
		return null;
	}
}));
jest.mock('../LoadMore', () => ({ __esModule: true, default: () => null }));
```

(`useTheme` needs no mock — `ThemeContext` has a working default value in `app/theme.tsx:18`.)

One test: **"re-renders with fresh isIgnored when the same room instance re-emits a mutated ignored list"**:

1. `const sub: any = { id: 'sub-1', rid: 'rid-1', t: 'c', ignored: [] };` (test-fixture `as any` idiom is fine).
2. `const item: any = { id: 'msg-1', ts: new Date('2024-01-01T10:00:00Z'), u: { _id: 'author-1' } };`
3. Create store via `getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: sub })`, render `<MessageRow item={item} previousItem={undefined as any} onLongPress={jest.fn()} />` inside `RoomStoreContext.Provider`.
4. `act(() => emit([sub]))`, assert `mockMessage` was last called with props containing `isIgnored: false`.
5. Mutate in place — `sub.ignored = ['author-1']` — then `act(() => emit([sub]))` (same instance, same ref: this mirrors WatermelonDB's re-emit behavior).
6. Assert `mockMessage` was last called with props containing `isIgnored: true` (use `expect.objectContaining`).

### 3. Revert-check (mandatory)

With the MessageRow source change temporarily reverted (back to `useRoomWithUpdate()` + local `isIgnored` function), the new test must FAIL — the compiled cache serves `isIgnored: false` after the mutation. Re-apply the fix; test passes. **State the revert-check result explicitly in your report.** If the test PASSES against the OLD code, the compiler-staleness analysis is wrong — STOP and report exactly what you observed instead of shipping.

## Scope

- **In scope:** `app/views/RoomView/components/MessageRow.tsx`, `app/views/RoomView/components/MessageRow.test.tsx` (new).
- **Out of scope — do not touch:** `RoomStoreContext.tsx` (`useRoomWithUpdate` stays — `RoomFooter` still uses it legitimately), `RoomFooter.tsx`, `RoomStore.ts`, `constants.ts`, `containers/message/**`, any other file.

## Verification / done criteria

1. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → 0 errors (180 pre-existing warnings expected) AND `npx tsc` → exit 0, no output. (Plain `pnpm lint` may fail in a nested worktree with a "couldn't determine the plugin import uniquely" error — environment quirk, use the split commands.)
2. `TZ=UTC pnpm test --testPathPattern='MessageRow'` → passes.
3. Revert-check performed and reported (see above).
4. `TZ=UTC pnpm test` → full suite passes, no snapshot churn.
5. `git diff --stat` shows only the 2 in-scope files.

## Test plan

The new compiled-component regression test above IS the test plan — it's the first test in the repo that exercises the React Compiler's interaction with the mutable-model store pattern.

## Maintenance note

Inside any `'use memo'` component, NEVER derive a value from the `room` model object in the component body (the compiler caches on the stable ref). Read fields inline in JSX/conditions (property-level guards stay fresh) or derive primitives inside a zustand selector. `useRoomWithUpdate()` remains correct only for consumers that read `room` fields inline (like `RoomFooter`).

## Escape hatches

- If the revert-check shows the old code passing the new test, STOP and report (see step 3).
- If mocking `../../../containers/message` breaks other suites via module registry leakage (it shouldn't — jest.mock is per-file), STOP and report.
- Do not wait passively on background tasks — run all verification in the foreground and report results.
