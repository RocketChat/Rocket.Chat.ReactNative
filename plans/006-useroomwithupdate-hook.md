# 006 — Extract `useRoomWithUpdate` hook + consumer re-render regression test

- **Status:** TODO
- **Priority:** P2
- **Effort:** S
- **Risk:** Low (mechanical refactor + new test; behavior unchanged)
- **Planned at:** `fa8b59703`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Zustand, React 19 + React Compiler (`'use memo'`). Prettier: tabs, single quotes, 130 width. Tests: Jest + `@testing-library/react-native`, run `TZ=UTC pnpm test`; DB tests mock `database.active` (repo pattern — never introduce LokiJS).

The RoomStore (`app/views/RoomView/stores/RoomStore.ts`) observes a WatermelonDB Subscription model. WatermelonDB re-emits the SAME mutated model instance when tracked columns change, so a zustand selector on `s.room` never re-fires (same reference). The store also sets `roomUpdate` — a fresh snapshot object per emit — as the deliberate re-render trigger (see `RoomStore.ts:134-144`).

Commit `d5990e277` fixed two components by pairing the `room` selector with a `roomUpdate` subscription. That produced an identical 5-line idiom duplicated in two files:

`app/views/RoomView/components/MessageRow.tsx:26-29`:

```ts
const room = useRoomStore(s => s.room);
// The room model mutates in place, so tracked-column changes keep the same `room` reference.
// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders this component.
useRoomStore(s => s.roomUpdate);
```

`app/views/RoomView/components/RoomFooter.tsx:36-39` — identical block.

Any future component copying only the `room` half silently reintroduces the stale-render bug. The idiom belongs in one shared hook, and the mechanism needs a component-level regression test (today only the store's snapshot emission is tested — `RoomStore.test.ts` — no test asserts a consumer component actually re-renders).

Current hook file `app/views/RoomView/stores/RoomStoreContext.tsx` (15 lines, entire file):

```tsx
import { createContext, useContext } from 'react';
import { useStore } from 'zustand';

import { type RoomState, type RoomStore } from './RoomStore';

export const RoomStoreContext = createContext<RoomStore | null>(null);

export const useRoomStore = <T,>(selector: (state: RoomState) => T): T => {
	const store = useContext(RoomStoreContext);
	if (!store) {
		throw new Error('Room store hooks must be used within a RoomStoreContext.Provider');
	}
	return useStore(store, selector);
};
```

## Change

1. **Add the hook** to `app/views/RoomView/stores/RoomStoreContext.tsx`, below `useRoomStore`:
   ```ts
   export const useRoomWithUpdate = (): RoomState['room'] => {
   	const room = useRoomStore(s => s.room);
   	// The room model mutates in place, so tracked-column changes keep the same `room` reference.
   	// Subscribing to `roomUpdate` (a fresh snapshot per emit) is what re-renders the caller.
   	useRoomStore(s => s.roomUpdate);
   	return room;
   };
   ```
2. **Migrate both call sites** — in `MessageRow.tsx` and `RoomFooter.tsx`, replace the 4-line idiom (selector + 2 comment lines + roomUpdate subscription) with:
   ```ts
   const room = useRoomWithUpdate();
   ```
   Update the import (both files already import `useRoomStore` from `../stores/RoomStoreContext`; they keep it if they still use it for other selectors — check each file's remaining `useRoomStore` calls before removing the import).
3. **Do NOT migrate** `RoomMessageActions.tsx` — it reads room fields at action time only (inside long-press handlers); the plain `s.room` selector there is correct and deliberate.
4. **Add regression test** `app/views/RoomView/stores/RoomStoreContext.test.tsx`:
   - Follow the mock/setup pattern of `app/views/RoomView/stores/RoomStore.test.ts` (it mocks `database.active` via the repo pattern and has a `setupObserve` helper whose observer emit can be driven manually; also uses `__resetRoomStoreRegistryForTests()` between cases).
   - Test: render a probe component under `<RoomStoreContext.Provider value={store}>` where `store` comes from `getOrCreateRoomStore`. The probe calls `useRoomWithUpdate()` and renders a tracked field (e.g. a Text with `room.ro ? 'ro' : 'rw'` or records values via a spy). Drive the observer emit with the SAME model object mutated in place (change a tracked column value, keep the object identity). Assert the probe re-rendered with the fresh value.
   - Contrast case: a probe using plain `useRoomStore(s => s.room)` does NOT re-render on the same emit (this documents WHY the hook exists). If asserting a negative re-render proves flaky, drop this case and note it.

## Scope

- **In scope:** `app/views/RoomView/stores/RoomStoreContext.tsx`, `app/views/RoomView/components/MessageRow.tsx`, `app/views/RoomView/components/RoomFooter.tsx`, new `app/views/RoomView/stores/RoomStoreContext.test.tsx`.
- **Out of scope — do not touch:** `RoomStore.ts`, `RoomMessageActions.tsx`, `ComposerStore.tsx`, any `app/containers/` file.

## Verification / done criteria

1. `pnpm lint` → exits 0.
2. `TZ=UTC pnpm test --testPathPattern='RoomStoreContext|RoomStore'` → passes.
3. `TZ=UTC pnpm test` → full suite passes.
4. `grep -rn "s => s.roomUpdate" app/views/RoomView/components/` → empty (idiom fully replaced by the hook).
5. `git diff --stat` shows only the 3 modified files + 1 new test file.

## Test plan

The regression test in step 4 is the test plan. Existing suites cover the migrated components indirectly.

## Maintenance note

Any new component that renders room fields (rather than reading them inside event handlers) must use `useRoomWithUpdate`, not `useRoomStore(s => s.room)`. Handler-time readers keep the plain selector.

## Escape hatches

- If React Compiler (`'use memo'`) memoization makes the probe's re-render assertion unreliable in Jest (compiler doesn't run in tests, so it shouldn't), STOP and report the exact failure instead of loosening assertions.
- If `MessageRow`/`RoomFooter` have gained additional `useRoomStore` selectors since `fa8b59703` that conflict with this migration, STOP and report.
