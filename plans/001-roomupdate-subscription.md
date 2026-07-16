# 001 — Subscribe `roomUpdate` in MessageRow and RoomFooter to fix stale renders

- **Status:** TODO
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (adds a re-render trigger; no behavior logic changes)
- **Planned at:** `59f97b0ac`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, React 19.1 + React Compiler (`'use memo'` directives — do NOT add manual `useMemo`/`useCallback`). Prettier: tabs, single quotes, 130 width.

`RoomView` (the chat screen) gets its room state from a Zustand store defined in `app/views/RoomView/stores/RoomStore.ts`. The store observes the WatermelonDB `subscriptions` table via `observeWithColumns`. **Critical mechanic:** WatermelonDB re-emits the _same cached model instance mutated in place_. So `store.setState({ room: next, ... })` sets the same object reference every emit — a Zustand selector on `s.room` compares with `Object.is`, sees the same reference, and **never re-renders the component**, even though tracked columns (ignored users, read-only flag, on-hold, blocked, etc.) changed.

The store already publishes the fix: alongside `room` it builds `roomUpdate`, a **fresh snapshot object per emit** (`RoomStore.ts:134-144`):

```ts
store.setState({
	room: next,
	// observeWithColumns re-emits the same cached model instance mutated in place, so a fresh
	// snapshot object is what re-renders consumers on a tracked-column change.
	roomUpdate: roomAttrsUpdate.reduce((ret: IRoomViewState['roomUpdate'], attr) => {
		ret[attr] = (next as TSubscriptionModel)[attr];
		return ret;
	}, {}),
	subscribed: true,
	joined: true
});
```

The established consumer pattern is in `app/views/RoomView/hooks/useHeader.tsx:52-61`:

```ts
const room = useStore(roomStore, s => s.room);
const roomUpdate = useStore(roomStore, s => s.roomUpdate);
...
// The room model mutates in place, so tracked-column changes keep the same `room` reference.
// `roomUpdate` is a fresh snapshot per emit and is the dependency that re-fires the header.
```

Two components subscribe to `s.room` only and therefore render stale output when a tracked column changes:

1. **`app/views/RoomView/components/MessageRow.tsx`** (line 26: `const room = useRoomStore(s => s.room);`). Renders from mutable room fields: `isIgnored(item)` reads `room.ignored` (lines 32-37), `getBadgeColor({ subscription: room, ... })` reads `room.tunread*` (line 98), and `LoadMore` gets `room.rid`/`room.t` (lines 79-80). If the user ignores/unignores someone, or thread-unread state changes, mounted rows don't reflect it until something else re-renders them.
2. **`app/views/RoomView/components/RoomFooter.tsx`** (line 36: `const room = useRoomStore(s => s.room);`). Render branches on `room.onHold` (line 60), `isBlocked(room)` (line 106), `isRoomFederated(room)` (line 114). A room going on hold or getting blocked while open doesn't swap the footer.

`useRoomStore` comes from `app/views/RoomView/stores/RoomStoreContext.tsx` and takes a selector, same as Zustand's `useStore`.

Note: `ignored`, `onHold`, `blocked`/`blocker`, `tunread`, `t` are all in `roomAttrsUpdate` (`app/views/RoomView/constants.ts:15-46`), so `roomUpdate` re-snapshots exactly when these change.

## Change

In **both** files, directly below the existing `const room = useRoomStore(s => s.room);` line, add:

```ts
// The room model mutates in place, so tracked-column changes keep the same `room` reference.
// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders this component.
useRoomStore(s => s.roomUpdate);
```

That is the whole change: a bare selector subscription. Zustand re-renders when the selected value's reference changes; `roomUpdate` is fresh per emit. The component keeps reading values off `room` (the live model instance), exactly like `useHeader` does. Do not assign the result to a variable (it would be unused and fail lint). Keep the two-line comment — without it the bare hook call looks like dead code.

## Scope

- **In scope:** `app/views/RoomView/components/MessageRow.tsx`, `app/views/RoomView/components/RoomFooter.tsx`.
- **Out of scope — do not touch:** `RoomStore.ts`, `useHeader.tsx`, `RoomMessageActions.tsx` (reads room fields at action time only — vetted, not stale), `app/containers/MessageComposer/**` (composer staleness is a separate deferred finding), any test snapshots not directly invalidated by this change.

## Verification / done criteria

Run from repo root:

1. `pnpm lint` → exits 0.
2. `TZ=UTC pnpm test` → all suites pass.
3. `git diff --stat` shows only the two files above, ~4 added lines each, no deletions of existing logic.

## Test plan

No new test files required. The re-render mechanic is store-level and already covered by `app/views/RoomView/stores/RoomStore.test.ts` (asserts `roomUpdate` is a fresh object per emit). Component-level render-count tests for this would need a WatermelonDB model mock that mutates in place — poor cost/benefit for a 2-line change; skip.

## Maintenance note

Any future component that subscribes `useRoomStore(s => s.room)` **and renders from mutable room fields** needs the same companion `roomUpdate` subscription. Reviewers should watch for new `s.room` selectors in `app/views/RoomView/components/`.

## Escape hatches

- If `useRoomStore(s => s.roomUpdate);` without assignment trips an ESLint rule (e.g. `no-unused-expressions` misfires on the call), assign it and reference it in the comment'd pattern used by `useHeader` instead: `const roomUpdate = useRoomStore(s => s.roomUpdate);` plus `void roomUpdate;` is NOT acceptable — in that case STOP and report the lint rule name.
- If either file no longer contains `useRoomStore(s => s.room)` at the cited lines (drift since `59f97b0ac`), STOP and report.
