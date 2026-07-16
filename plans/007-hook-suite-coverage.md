# 007 — Expand useRoomLifecycle / useRoomNavigation suites to the untested contract surface

- **Status:** TODO
- **Priority:** P3
- **Effort:** M
- **Risk:** Low (test-only; no source changes)
- **Planned at:** `fa8b59703`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Jest + `@testing-library/react-native` (`renderHook`), run `TZ=UTC pnpm test`. Prettier: tabs, single quotes, 130 width. Never introduce LokiJS; mock modules at the path the SUT imports.

Commit `fa8b59703` added first direct suites for two large RoomView hooks, but they cover only part of each hook's returned contract:

1. `app/views/RoomView/hooks/useRoomLifecycle.test.ts` (6 tests) covers: mount-init effect, `handleSendMessage`, unmount cleanup. **Untested returns:** `joinRoom`, `resumeRoom`, `onJoin`, `toggleFollowThread`, `fetchThreadName`; also untested: the `ROOM_REMOVED` listener and the INVITED→non-INVITED re-init effect (read the hook: `app/views/RoomView/hooks/useRoomLifecycle.ts`, ~330 lines).
2. `app/views/RoomView/hooks/useRoomNavigation.test.ts` (7 tests) covers: `navToRoomInfo`, `navToThread`, `goRoomActionsView`. **Untested returns:** `navToRoom`, `consumeJumpParam`, `onThreadMessagesLoaded`, `onEncryptedPress`, `onDiscussionPress`, `jumpToMessageByUrl`, `handleEnterCall` (read `app/views/RoomView/hooks/useRoomNavigation.ts`, ~330 lines).

Both test files already have the full mock scaffolding (`renderRoomLifecycle` / `renderRoomNavigation` builders with override params, module mocks for sendMessage/restApi/omnichannel/log/Thread services etc.). **Extend those files — do not create new files or new builders.** Read both test files fully first; reuse their patterns (e.g. `jest.clearAllMocks()` in `beforeEach`, `InteractionManager.runAfterInteractions` inline-run spy in the lifecycle suite).

## Change

Add cases to the two existing test files. Assert current behavior (characterization) — read each function in the hook before writing its test. Target list:

### `useRoomLifecycle.test.ts`

- `joinRoom` non-omnichannel: calls the join service with rid + joinCode ref value, then `roomStore.getState().join()` (read the actual implementation — assert the real call shapes).
- `joinRoom` omnichannel (`isOmnichannel: true`, room has `_id`): calls `takeInquiry` with `_id` and serverVersion, then `join()`.
- `resumeRoom` (omnichannel path): assert what it calls (`takeResume`) and guards.
- `toggleFollowThread`: calls `toggleFollowMessage` REST with (threadId, isFollowingThread flipped/as-passed — read the code) and shows the toast/event it triggers (mock what it imports).
- `fetchThreadName`: delegates to `getThreadName` service and returns its value.
- `ROOM_REMOVED` handler: if the hook wires an EventEmitter/listener for room removal (read how it subscribes — `useRoomLifecycle.ts` ~143-150 and ~272), simulate the event for the matching rid → asserts nav popToTop + error alert (mock `Navigation` and `showErrorAlert` at the paths the hook imports). If the subscription mechanism can't be driven from the test without reproducing WatermelonDB observers, drop this case and note it.
- INVITED→non-INVITED re-init: the effect (~304-311) re-runs `init` when the room stops being an invite. Drive it by re-rendering the hook with changed params/store state per the actual dependency list. If it depends on store-internal observer emissions that can't be driven, drop and note.

### `useRoomNavigation.test.ts`

- `navToRoom`: asserts the navigate/push call shape (master-detail both ways if it branches — read it).
- `onDiscussionPress`: asserts push to RoomView with discussion params (read the guard conditions).
- `onEncryptedPress`: asserts navigation target (encryption screen) and params.
- `jumpToMessageByUrl`: mock the URL-parse/message-fetch services it imports; assert it triggers the jump path (`jumpToMessage` from the mocked `useJumpToMessage`) or navigation; assert the loading-event wrapping if present.
- `handleEnterCall`: assert what it dispatches/navigates (read the implementation; mock video-conf modules at the imported paths).
- `consumeJumpParam` + `onThreadMessagesLoaded`: assert their observable effects (setParams / ref mutations / callbacks).

Keep it to behavior contracts; skip cases that would need more than ~3 NEW module mocks each — drop those and list them in the report instead.

## Scope

- **In scope:** `app/views/RoomView/hooks/useRoomLifecycle.test.ts`, `app/views/RoomView/hooks/useRoomNavigation.test.ts` (extend in place).
- **Out of scope — do not touch:** any source file; any other test file. If a case needs a source change (e.g. an export), drop it and report.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='useRoomLifecycle|useRoomNavigation'` → passes.
2. `TZ=UTC pnpm test` → full suite passes, no snapshot churn.
3. `pnpm lint` → exits 0.
4. `git diff --stat` shows only the two test files modified.

## Test plan

This plan is the test plan.

## Maintenance note

These suites are the characterization baseline for the RoomView hooks; structural refactors to either hook should keep them green or consciously update them.

## Escape hatches

- If a target function turns out to be unreachable without more than ~3 new module mocks, drop that case and report it — do not brute-force.
- If extending the suites pushes either file's module-mock count past ~12 total, STOP and report — that's an extract-service signal, not something to push through.
