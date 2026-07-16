# 005 — Direct unit tests for useRoomLifecycle, useRoomNavigation, ComposerStore

- **Status:** TODO
- **Priority:** P2
- **Effort:** M
- **Risk:** Low (test-only; no source changes)
- **Planned at:** `59f97b0ac`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Jest (`TZ=UTC pnpm test`), `@testing-library/react-native` available. Repo testing rules: mock `database.active` (repository pattern) — **never** introduce LokiJS adapters; mock modules at the path the SUT imports.

This branch migrated `RoomView` from a class component to hooks. Three of the largest new units have **zero direct tests** (they're only exercised incidentally through other suites):

1. `app/views/RoomView/hooks/useRoomLifecycle.ts` (~322 lines) — mount/unmount orchestration, `handleSendMessage: (message: string, tshow?: boolean) => void` (line 65), app-state and encryption wiring.
2. `app/views/RoomView/hooks/useRoomNavigation.ts` (~330 lines) — nav param handling, `navToRoomInfo`, thread navigation, master-detail branches.
3. `app/views/RoomView/stores/ComposerStore.tsx` (89 lines) — provider that copies 13 props into a Zustand store via a dependency-gated `useEffect` (lines 39-70), plus 13 selector hooks.

Existing exemplars to copy patterns from (read them before writing anything):

- `app/views/RoomView/stores/RoomStore.test.ts` — store testing, registry reset helper, DB mocking.
- `app/views/RoomView/RoomProviders.test.tsx` — provider rendering with `@testing-library/react-native`, wrapping children, asserting store contents.
- Any `renderHook` usage: `grep -rln "renderHook" app --include='*.test.*'` and follow the closest match's setup.

## Change

Create three test files. Priorities inside each: behavior contracts, not implementation mirroring. Keep each suite focused — this is a first safety net, not exhaustive coverage.

### 1. `app/views/RoomView/stores/ComposerStore.test.tsx`

- Render `ComposerProvider` with a full prop set; assert each of the 13 hooks (`useComposerRid`, `useComposerRoom`, `useOnSendMessage`, etc.) returns the seeded value.
- Re-render with one changed prop (e.g. new `isAutocompleteVisible`) → the corresponding hook value updates (the `useEffect` sync works).
- Calling any hook outside the provider throws `'Composer store hooks must be used within a ComposerProvider'`.
- Store identity is stable across re-renders (`useState(() => createComposerStore(...))` — provider does not recreate the store).

### 2. `app/views/RoomView/hooks/useRoomLifecycle.test.ts(x)`

Read the hook first; test its **exported contract**, roughly:

- `handleSendMessage` calls the send service with `(rid, message, tmid, user, tshow)` shape and calls `markMessageSent` / clears lastOpen (whatever the code does — assert actual current behavior).
- Mount triggers `init()` on the room store exactly once per rid; unmount runs the cleanup/release path.
- Pick 3-5 highest-value behaviors; skip animation/InteractionManager timing internals (mock `InteractionManager.runAfterInteractions` to run inline — check how existing suites mock it).

### 3. `app/views/RoomView/hooks/useRoomNavigation.test.ts(x)`

- `navToRoomInfo` navigates to `RoomInfoView` with expected params and early-returns when target is self (mirror the guard in `app/views/SearchMessagesView/index.tsx:197-203` if the hook has the same rule — read the hook, assert what it does).
- Thread jump path pushes `RoomView` with `tmid` params.
- Master-detail branch: mock the responsive-layout hook both ways, assert route target differs.

Mock `react-navigation` at the boundary the hook consumes (navigation object or `lib/navigation/appNavigation`), Redux via the store-wrapper pattern used in existing hook tests.

## Scope

- **In scope:** the three new test files; tiny test-only helpers colocated in those files.
- **Out of scope — do not touch:** any source file. If a unit is untestable without a source change (e.g. needs an export), STOP and report rather than editing source.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='ComposerStore|useRoomLifecycle|useRoomNavigation'` → new suites pass.
2. `TZ=UTC pnpm test` → full suite passes (no snapshot churn).
3. `pnpm lint` → exits 0.
4. `git diff --stat` shows only added `*.test.*` files.

## Test plan

This plan **is** the test plan.

## Maintenance note

These suites are the characterization baseline for the next RoomView refactor wave — future structural changes to the two hooks should keep these green or consciously update them.

## Escape hatches

- If `useRoomLifecycle`/`useRoomNavigation` require more than ~8 module mocks to render, STOP and report — that's an architecture signal (extract-service candidate), not something to brute-force.
- If any assertion requires reproducing WatermelonDB observer emissions, mock at the store boundary instead; if impossible, drop that case and note it.
