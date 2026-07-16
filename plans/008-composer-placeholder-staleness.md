# 008 — Fix ComposerInput placeholder staleness by threading `roomUpdate` into the ComposerStore

- **Status:** TODO
- **Priority:** P2
- **Effort:** S
- **Risk:** Low (additive optional field; ShareView path untouched)
- **Planned at:** `2f12a58ad`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Zustand, React 19 + React Compiler (`'use memo'`). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest + `@testing-library/react-native`, run `TZ=UTC pnpm test`. Never use `any`.

**The bug class (already fixed twice on this branch):** `RoomStore` (`app/views/RoomView/stores/RoomStore.ts`) observes a WatermelonDB Subscription model. WatermelonDB re-emits the SAME mutated model instance when tracked columns change, so any zustand selector on the `room` object never re-fires (same reference, `Object.is` equality). The store therefore also sets `roomUpdate` — a fresh snapshot object per emit — as the deliberate re-render trigger. `app/views/RoomView/stores/RoomStoreContext.tsx` has `useRoomWithUpdate()` which pairs both subscriptions; `MessageRow`/`RoomFooter` use it.

**The remaining instance:** `ComposerInput` (`app/containers/MessageComposer/components/ComposerInput.tsx:65,76-82`) renders its placeholder at render time:

```ts
	const room = useComposerRoom();
	...
	let placeholder = tmid ? I18n.t('Add_thread_reply') : '';
	if (room && !tmid) {
		placeholder = I18n.t('Message_roomname', { roomName: (room.t === 'd' ? '@' : '#') + getRoomTitle(room) });
```

`useComposerRoom` (`app/views/RoomView/stores/ComposerStore.tsx:81`) is `useComposerStore(s => s.room)` — no `roomUpdate` pairing. The `room` object flows: `RoomView/index.tsx:150` (`useStore(roomStore, s => s.room)`) → `<RoomProviders room={room}>` (index.tsx:435) → `ComposerProvider`'s sync effect (`ComposerStore.tsx:42-73`) → `store.setState({ room: state.room, ... })`. Two layers keep it stale: the prop reference never changes (same mutated model), and even when the effect re-runs, setState with the same reference doesn't notify `s.room` subscribers. Net effect: rename a channel while its composer is open → placeholder "Message #oldname" is stuck until remount.

**Why NOT the obvious fix:** swapping `useComposerRoom()` for `useRoomWithUpdate()` inside `ComposerInput` would crash ShareView. `app/views/ShareView/index.tsx:413` renders `MessageComposerContainer` (→ `ComposerInput`) inside `RoomProviders` but with NO `RoomStoreContext.Provider` (only `RoomView/index.tsx:430` provides that), and `useRoomStore` throws without it. Do not do this.

**The correct fix** mirrors the RoomStore pattern inside the ComposerStore: add an optional `roomUpdate` field, thread it from RoomView (which already subscribes to it at `index.tsx:151`, so it re-renders per emit), and pair the subscription inside `useComposerRoom`. ShareView passes no `roomUpdate` → the slice stays `undefined` forever → zero behavior change there.

## Change

All edits below; keep Prettier style (tabs, 130 width).

1. **`app/views/RoomView/stores/ComposerStore.tsx`**
   - `ComposerState` gains, right below the `room` field (line 11):
     ```ts
     	roomUpdate?: IRoomViewState['roomUpdate'];
     ```
     (`IRoomViewState` is already imported in this file.)
   - `ComposerProvider`'s sync effect: add `roomUpdate: state.roomUpdate,` to the `store.setState({ ... })` object (below `room`) and `state.roomUpdate,` to the dependency array (below `state.room`).
   - Replace the `useComposerRoom` one-liner (line 81) with:
     ```ts
     export const useComposerRoom = (): ComposerState['room'] => {
     	// The room model mutates in place, so tracked-column changes keep the same `room` reference.
     	// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders the caller.
     	useComposerStore(s => s.roomUpdate);
     	return useComposerStore(s => s.room);
     };
     ```
2. **`app/views/RoomView/RoomProviders.tsx`** — `IRoomProvidersProps` already extends `ComposerState`, so the type picks the field up automatically. Add `roomUpdate` to the destructured props (below `room`) and pass `roomUpdate={roomUpdate}` to `<ComposerProvider>` (below the `room` prop).
3. **`app/views/RoomView/index.tsx`** — at the `<RoomProviders>` element (~line 431), add `roomUpdate={roomUpdate}` below the `room={room}` prop. The `roomUpdate` variable already exists at line 151.
4. **`app/views/RoomView/stores/ComposerStore.test.tsx`** — add ONE test to the existing `describe` block, following the existing `Probe`/`Parent` + `render`/`rerender` pattern (see the `isAutocompleteVisible` test at lines 66-85):
   - Probe calls `useComposerRoom()` and records `spy(getRoomTitleLikeField)` — concretely: seed `room` as a mutable object `const mutableRoom = { rid: 'rid-1', t: 'c', name: 'old' };`, probe records `room && 'name' in room ? room.name : undefined`.
   - Parent takes a `roomUpdate` prop and spreads `fullProps()` with `room={mutableRoom} roomUpdate={roomUpdate}`.
   - Render with `roomUpdate={{}}`, assert last spy call `'old'`. Mutate in place (`mutableRoom.name = 'new'`) and rerender with a NEW `roomUpdate` object (`{ name: 'new' } as any` is NOT allowed — use a fresh `{}` cast to the proper type or `{ name: 'new' }` if it type-checks against `IRoomViewState['roomUpdate']`; read `app/views/RoomView/definitions.ts:48` to see the shape and pick fields that type-check without `any`). Assert last spy call `'new'`.
   - Do NOT add `roomUpdate` to `fullProps()` — the first test's `toEqual(props)` doesn't have a matching hook for it and must stay green as-is.

## Scope

- **In scope:** `app/views/RoomView/stores/ComposerStore.tsx`, `app/views/RoomView/RoomProviders.tsx`, `app/views/RoomView/index.tsx` (one prop line), `app/views/RoomView/stores/ComposerStore.test.tsx`.
- **Out of scope — do not touch:** `ComposerInput.tsx` (its `useComposerRoom()` call is already correct once the hook pairs subscriptions), `ShareView`, `RoomStore.ts`, `RoomStoreContext.tsx`, `app/containers/MessageComposer/` (anything), `RoomProviders.test.tsx` (unless it fails — see escape hatches).

## Verification / done criteria

1. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → 0 errors (180 pre-existing warnings expected) AND `npx tsc` → exit 0, no output. (Plain `pnpm lint` may fail in a nested worktree with a "couldn't determine the plugin import uniquely" error — that's an environment quirk, use the split commands.)
2. `TZ=UTC pnpm test --testPathPattern='ComposerStore|RoomProviders'` → passes, including the new test.
3. `TZ=UTC pnpm test` → full suite passes, no snapshot churn.
4. `git diff --stat` shows only the 4 in-scope files.
5. `grep -n "roomUpdate" app/views/ShareView/index.tsx` → empty (ShareView untouched).

## Test plan

The new ComposerStore.test.tsx case in step 4 is the test plan (regression test for the pairing). Existing suites cover the threading indirectly.

## Maintenance note

Any future field in `ComposerState` sourced from a WatermelonDB model needs the same treatment: pair its selector with `s.roomUpdate` (or thread its own update-snapshot). Handler-time readers don't.

## Escape hatches

- If `RoomProviders.test.tsx` fails because its fixtures now miss `roomUpdate`: the field is optional, so it shouldn't — if it does anyway, STOP and report the exact failure instead of editing that file.
- If the `roomUpdate` object literal in the test can't be typed against `IRoomViewState['roomUpdate']` without `any`, STOP and report the shape you found.
- Do not wait passively on background tasks — run all verification in the foreground and report results.
