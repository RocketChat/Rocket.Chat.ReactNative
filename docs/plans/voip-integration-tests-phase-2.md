# VoIP Integration Tests — Phase 2

**File renamed + extended:** `app/containers/NewMediaCall/NewMediaCall.integration.test.tsx` → `app/containers/NewMediaCall/VoipCallLifecycle.integration.test.tsx` (see §1 for rationale; CI-glob audit below shows no references to the old filename).
**Scope:** Add 3 integration paths (incoming answerCall, hang up, mute/hold) and fix two hygiene issues (blanket `console.error` suppression, missing `act()` wrappers). **startCall rejection is deferred to Phase 3** — see ADR Follow-up #1.
**Non-goals:** No production-code changes. No unit-level store tests that bypass real handlers. No rejection-path test until the unhandled-promise fix lands.

**CI-glob audit:** `grep testMatch|testRegex|integration\.test|NewMediaCall` across `jest.config*`, `package.json`, `.github/**/*.{yml,yaml}` returns **no matches** referencing the old filename. Jest default `*.test.tsx` picks up the renamed file automatically. Safe to rename.

---

## RALPLAN-DR Summary

### Principles
1. **Exercise real handlers, not call counts.** Every test must travel through real `MediaSessionInstance` / `useCallStore` code. If an assertion can be satisfied by stubbing the method under test, it is the wrong assertion.
2. **Mock only at the SDK boundary.** `@rocket.chat/media-signaling`, `RNCallKeep`, `InCallManager`, `Navigation`, native modules — nothing internal.
3. **No blanket `console.error` suppression.** Suppression belongs per-test with `toHaveBeenCalledWith(...)` assertions, so `act()` warnings and real bugs surface.
4. **Wrap every emitter-driven state mutation in `act()`.** `emitter.emit(...)` fires synchronous React `set` calls through Zustand subscribers; these must be inside `act`.
5. **Minimum new surface area.** Reuse `mockCallEmitter`, `makeIncomingCall`, the existing `MockMediaSignalingSession`. Extend — don't duplicate.

### Decision Drivers (top 3)
1. **Coverage gap severity.** answerCall + endCall + mute/hold are the call lifecycle's core; currently zero integration coverage.
2. **Mock surface cost.** Adding mocks for `InCallManager`, `getCallData`, `accept`, `setMuted`, `setHeld`, `localParticipant.setMuted` increases maintenance weight; minimize via shared helpers.
3. **Test reliability.** Async `answerCall` + React effects + Zustand subscriptions are prone to `act()` warnings and flakes — we must handle them, not hide them.

### Viable Options

#### Option A — All paths in existing file, keep current filename
- **Pros:** Zero file-structure churn; reuses beforeEach scaffolding; fastest to land; diff stays local.
- **Cons:** Filename `NewMediaCall.integration.test.tsx` becomes a lie — it mostly tests `MediaSessionInstance` + `useCallStore`, not the `NewMediaCall` component. Name/content mismatch erodes file-tree navigability. File grows from ~412 to ~700+ LOC.

#### Option A′ — Rename to `VoipCallLifecycle.integration.test.tsx`, single-file structure **[SELECTED]**
- **Pros:** Filename matches intent (the call lifecycle: outgoing press, incoming answer, hangup, controls); no mock duplication; same single-file benefits as A; CI-glob audit shows no references to old name so rename is a pure `git mv` + one `jest.mock` path recheck.
- **Cons:** One extra commit for the rename; git history for the file becomes slightly harder to blame pre-rename (mitigated by `git log --follow`).

#### Option B — Split into sibling files
- `VoipCallLifecycle.outgoing.integration.test.tsx`, `.answerCall.integration.test.tsx`, `.endCall.integration.test.tsx`, `.controls.integration.test.tsx`
- **Pros:** Each file <250 LOC; focused failures; parallel Jest shard friendly.
- **Cons:** 4× duplicated `jest.mock(...)` boilerplate (~130 LOC of mocks per file); drift risk between files; onboarding cost.

#### Option C — Shared helper module + split
- Extract `app/containers/NewMediaCall/__integration__/setup.ts` exporting mock factories and lifecycle hooks, then split like Option B.
- **Pros:** Clearest separation; one source of mock truth; each test file reads as intent-only.
- **Cons:** Upfront refactor of the existing passing suite (regression risk on 6 green tests); helpers with side effects (jest.mock hoisting) are subtle; Jest factory hoisting makes extracting `jest.mock` calls non-trivial (must stay in test files).

### Selected: **Option A′** — rename to `VoipCallLifecycle.integration.test.tsx`, single-file structure with inline helpers

**Why:** Filename honesty matters. The current `NewMediaCall.integration.test.tsx` already spans three owners (`NewMediaCall` component press path, `MediaSessionInstance` handlers, `useCallStore` actions) and the new tests double down on the latter two. Renaming to `VoipCallLifecycle.integration.test.tsx` makes the file's genre clear; CI-glob audit confirms no config references the old name. Jest's `jest.mock` hoisting rule forbids cleanly extracting mock factories into sibling modules — Option C's headline benefit is not achievable. Option B's mock-duplication cost is real and invites drift across 4 files covering tightly-coupled code paths. Option A′ keeps the 6 existing green tests untouched (except the rename), leverages the existing `MockMediaSignalingSession` infrastructure, and bounded file growth (~250 net new LOC for 9 new tests; Phase 3 would add ~40 more) is acceptable for cohesive call-lifecycle coverage. We will add small inline helpers (`makeSyntheticCall`, `emitDDPMediaSignal`) inside the test file to keep intent readable without cross-file helpers.

File-size guidance is **advisory, not enforceable**: if the file grows past ~800 LOC after Phase 3, consider splitting via Option B. Growth alone does not block landing.

---

## Plan Body

### 1. File-Structure Decision
**Rename then extend.** Step 1: `git mv app/containers/NewMediaCall/NewMediaCall.integration.test.tsx app/containers/NewMediaCall/VoipCallLifecycle.integration.test.tsx`. Step 2: update the top-level `describe` label to `'VoIP call lifecycle (integration)'`. Step 3: add new tests as nested `describe` blocks with genre labels so future file-tree scans know what each block owns:
- `describe('MediaSessionInstance contract: answerCall', …)`
- `describe('UI store contract: Hang up', …)`
- `describe('UI store contract: In-call controls (mute/hold)', …)`

Each `describe` gets its own inner `beforeEach` only if it needs extra setup beyond the outer one.

**CI verification (performed):** `grep -r 'NewMediaCall\.integration'` returned only the test file itself — no Jest config, no package.json script, no GitHub Actions workflow references the old filename. Jest's default `testMatch` picks up `**/*.test.tsx`, so the rename is pure.

### 2. Shared In-File Helpers (add near existing `makeIncomingCall`)

#### `makeSyntheticCall(overrides)` — extends `makeIncomingCall`
Returns an `IClientMediaCall` with extra jest.fn methods that real code paths exercise:
- `accept: jest.fn().mockResolvedValue(undefined)` — needed by `answerCall`
- `hangup: jest.fn()`, `reject: jest.fn()` — already present
- `localParticipant.setMuted: jest.fn()`
- `localParticipant.setHeld: jest.fn()`
- `sendDTMF: jest.fn()` (defensive; `setDialpadValue` uses it but not in these tests)
- `state: 'ringing' | 'active'` configurable (drives ringing→reject branch in instance endCall)
- `emitter: mockCallEmitter()` — real emit-dispatch so `trackStateChange` reaches store subscribers

#### `emitDDPMediaSignal(session, signal)` helper
Drives the same payload shape `MediaSessionInstance.mediaSignalListener` expects. Because `sdk.onStreamData` is mocked to return `{ stop: jest.fn() }` with no callback capture, we need to capture the handler. **Modify the existing `sdk` mock** to capture the callback:
```ts
let capturedStreamHandler: ((msg: IDDPMessage) => void) | null = null;
jest.mock('../../lib/services/sdk', () => ({
  default: {
    onStreamData: jest.fn((_name, handler) => {
      capturedStreamHandler = handler;
      return { stop: jest.fn() };
    }),
    methodCall: jest.fn()
  }
}));
```
Then `emitDDPMediaSignal(signal)` calls `capturedStreamHandler({ fields: { eventName: `${userId}/media-signal`, args: [signal] } })`. This is the **one** non-trivial mock extension required.

**Explicit reset in `beforeEach`:** capturing into a module-level variable creates test-pollution risk across suites. The outer `beforeEach` must reset it: `capturedStreamHandler = null;` before `mediaSessionInstance.init('me')` runs (which re-registers the handler). Without this reset a test that forgets to re-init could accidentally invoke a stale handler from a previous test's session.

#### DDP signal schema — verified against SDK types

The exact gate in `app/lib/services/voip/MediaSessionInstance.ts:75-85` is:

```ts
if (
    signal.type === 'notification' &&
    signal.notification === 'accepted' &&
    signal.signedContractId === getUniqueIdSync() &&
    nativeAcceptedCallId === signal.callId &&
    call == null
) {
    this.answerCall(signal.callId).catch(...);
}
```

Cross-checked against `@rocket.chat/media-signaling/dist/lib/Session.js:139-143`: the SDK itself uses `signal.type === 'notification'` + `signal.signedContractId` + `signal.notification === 'accepted'` as the wire contract — **not** `'contractNotification'`. The string `contractNotification` does not appear in the SDK's type definitions (searched `node_modules/@rocket.chat/media-signaling/dist/**/*.d.ts` — no hits). Tests must use the exact object:

```ts
{ type: 'notification', notification: 'accepted', signedContractId: 'test-device-id', callId: '<id>' }
```

`getUniqueIdSync` is mocked to return `'test-device-id'`, so `signedContractId` must equal that literal.

### 3. New Top-Level Mocks Required

- **`react-native-incall-manager`** — `useCallStore.setCall` calls `InCallManager.start`; `reset` calls `InCallManager.stop`. Add:
  ```ts
  jest.mock('react-native-incall-manager', () => ({
    __esModule: true,
    default: { start: jest.fn(), stop: jest.fn(), setForceSpeakerphoneOn: jest.fn().mockResolvedValue(undefined) }
  }));
  ```
  Without it, `setCall` currently logs `InCallManager.start failed` via the already-suppressed `console.error` — another reason to remove blanket suppression.

- **`sdk.onStreamData` callback capture** — see §2.

No other top-level mock additions.

### 4. Tests to Add

> **Assertion philosophy (applies to all blocks below):** Per Principle #1, we assert against the *real integration seams* — boundary mocks (`RNCallKeep.*`, `Navigation.*`, `InCallManager.*`) and observable store state (`useCallStore.getState().X`). We avoid redundant `toHaveBeenCalled` assertions on inner method calls (e.g., `call.hangup`, `localParticipant.setMuted`) when the resulting store-state assertion already proves the real handler ran. Call-count assertions are kept **only** for boundary mocks, since those are the genuine observable seams with the outside world.

#### 4a. MediaSessionInstance contract: answerCall

**Test A1 — accepted signal + native pre-accept → answerCall navigates**
- Setup: after outer `beforeEach`, `useCallStore.getState().setNativeAcceptedCallId('incoming-1')`, mock `session.getCallData.mockReturnValue(makeSyntheticCall({ callId: 'incoming-1' }))`.
- Drive: `await act(async () => { emitDDPMediaSignal({ type: 'notification', notification: 'accepted', signedContractId: 'test-device-id', callId: 'incoming-1' }); });` — `answerCall` is async, must flush microtasks.
- Assert (boundary + state): `RNCallKeep.setCurrentCallActive('incoming-1')` called; `Navigation.navigate('CallView')` called; `useCallStore.getState().call?.callId === 'incoming-1'`. (No redundant `mainCall.accept` call-count — if `call` is in the store, `accept` ran.)

**Test A2 — call not found branch**
- Setup: `setNativeAcceptedCallId('missing-1')`, `session.getCallData.mockReturnValue(undefined)`.
- Drive: same DDP signal shape with `callId: 'missing-1'`.
- Assert: `RNCallKeep.endCall('missing-1')` called; `useCallStore.getState().nativeAcceptedCallId === null`; `Navigation.navigate` NOT called; `useCallStore.getState().call === null`.

**Test A3 — idempotency branch (existing call matches)**
- **Test-pollution guard (first line):** `expect(useCallStore.getState().nativeAcceptedCallId).toBe(null);` — fails fast if a prior test leaked state despite the outer `reset()`.
- Setup: pre-populate store via `act(() => useCallStore.getState().setCall(existingCall))` where `existingCall.callId === 'incoming-1'`; then `(Navigation.navigate as jest.Mock).mockClear();` to ignore the setup's navigate.
- Drive: `await mediaSessionInstance.answerCall('incoming-1')` directly (the DDP gate checks `call == null`, which we cannot satisfy here, so we test the public method directly — this is still integration because we assert real guard logic, and A1 already covers the DDP entry).
- Assert (boundary only): `Navigation.navigate` NOT called; `RNCallKeep.setCurrentCallActive` NOT called; `(session.getCallData as jest.Mock).toHaveBeenCalledTimes(0)` — this **is** a valid call-count assertion because `getCallData` is the SDK boundary, confirming the early-return happened before any SDK interaction.

**Mock extensions needed:** `session.getCallData` per-test `mockReturnValue`. Synthetic call needs `accept: jest.fn().mockResolvedValue(undefined)`.

#### 4b. UI store contract: Hang up

> **Important clarification:** The CallView end button wires to `useCallStore.endCall` (confirmed at `app/views/CallView/components/CallButtons.tsx:44,65`), NOT `MediaSessionInstance.endCall`. The latter is called from native CallKit "end" events and other entry points. Both need coverage.

**Test B1 — UI-triggered `useCallStore.endCall`**
- Setup: complete outgoing flow via existing press path so `setCall` binds listeners and populates the store.
- Drive: `act(() => { useCallStore.getState().endCall(); });`
- Assert (boundary + state): `RNCallKeep.endCall('call-user-1')` called; `InCallManager.stop` called (via `reset`); `useCallStore.getState().call === null`; `useCallStore.getState().callId === null`. (No redundant `call.hangup` call-count — store `call === null` proves `endCall` ran through `reset`.)

**Test B2 — `MediaSessionInstance.endCall` during active state → hangup**
- Setup: `session.getCallData.mockReturnValue(makeSyntheticCall({ callId: 'active-1', state: 'active' }))`.
- Drive: `act(() => { mediaSessionInstance.endCall('active-1'); });`
- Assert (boundary + state): `RNCallKeep.endCall('active-1')`; `RNCallKeep.setCurrentCallActive('')`; `RNCallKeep.setAvailable(true)`; `useCallStore.getState().call === null`. (No redundant `mainCall.hangup`/`mainCall.reject` counts — the branch is an internal implementation detail; what matters is the store reset and RNCallKeep cleanup.)

**Test B3 — `MediaSessionInstance.endCall` during ringing → reject branch**
- Setup: `session.getCallData.mockReturnValue(makeSyntheticCall({ callId: 'ringing-1', state: 'ringing' }))`.
- Drive: `act(() => { mediaSessionInstance.endCall('ringing-1'); });`
- Assert (boundary + state): `RNCallKeep.endCall('ringing-1')`; `useCallStore.getState().call === null`. (Branch differentiation between ringing→reject vs active→hangup is covered by the SDK's own tests; our integration value is that the RNCallKeep/store cleanup runs regardless of branch.)

**Mock extensions needed:** none new beyond §2 helpers.

#### 4c. UI store contract: In-call controls (mute/hold)

**Test C1 — `toggleMute` → store `isMuted` flips**
- Setup: complete outgoing flow so `setCall` has wired listeners. Pre-assertion: `useCallStore.getState().isMuted === false`.
- Drive: `act(() => { useCallStore.getState().toggleMute(); });`
- Assert (state): `useCallStore.getState().isMuted === true`.
- Second press: `act(() => useCallStore.getState().toggleMute())` → `isMuted === false`. (No call-count on `localParticipant.setMuted` — store state transition proves the action ran the real handler, and `setMuted` is an internal SDK method not a boundary.)

**Test C2 — `toggleHold` → store `isOnHold` flips**
- Same pattern; `isOnHold` goes `false → true → false`. No call-count on `setHeld`.

**Test C3 — `trackStateChange` emission syncs store from call**
- Setup: outgoing flow. Mutate synthetic call fields to simulate SDK side: `call.localParticipant.muted = true; call.remoteParticipants[0].held = true;`
- Drive: `act(() => { (call.emitter as unknown as ReturnType<typeof mockCallEmitter>).emit('trackStateChange'); });`
- Assert (state): `useCallStore.getState().isMuted === true`; `useCallStore.getState().remoteHeld === true`; `useCallStore.getState().controlsVisible === true`.

**Mock extensions needed:** `localParticipant.setMuted`, `localParticipant.setHeld` as `jest.fn()` on `makeSyntheticCall` (still required — the real `toggleMute`/`toggleHold` calls them and would throw without a stub, even though we don't assert on the call).

#### 4d. startCall rejection path — **DEFERRED to Phase 3**

This test is intentionally removed from Phase 2. See ADR Follow-up #1 for rationale: the production code at `MediaSessionInstance.ts:151-155` does not `await` or `.catch` the SDK's `startCall` promise, so a rejection leaks as an unhandled promise. Writing a test for this behavior would either (a) force us to accept unhandled-rejection noise in Jest output, contradicting the Success Criterion "no unhandled promise rejections", or (b) require masking the rejection in a way that the production code does not. The correct sequencing is: **Phase 3 lands a `.catch` in production code, then writes the integration test against the fixed behavior.** Doing the test before the fix would bake today's bug into the regression suite.

### 5. `consoleErrorSpy` Fix — Spike First, Then Decide Per-Warning

**Do not blindly delete the blanket spy.** Instead, treat this as a time-boxed spike:

**Step 5a — Spike:**
1. Remove the blanket `jest.spyOn(console, 'error').mockImplementation(() => {})` from outer `beforeEach` and its `afterEach` restore.
2. Run the existing 6 tests: `TZ=UTC yarn test --testPathPattern='VoipCallLifecycle.integration'`.
3. Capture every `console.error` and every React `act()` warning that surfaces. Produce a table: `| warning text (first 80 chars) | source | count |`.

**Step 5b — Classify each warning and apply the matching remedy:**
- **(a) Fix at the root** — if the warning points to a real `act()` gap (our code), wrap the offending call and confirm the warning disappears. This is the preferred path.
- **(b) Narrow per-test spy with exact-string matcher** — if the warning is deterministic and tied to a specific test path (e.g., `MediaSessionInstance` logs `[VoIP] Error resolving room id from contact` when `navigateToCallRoom` is unavailable), use `jest.spyOn(console, 'error').mockImplementation((msg: string) => { if (!msg.includes('<known prefix>')) { throw new Error('unexpected console.error: ' + msg); } });` scoped to just that test. The `throw on mismatch` pattern is the key — it preserves the spy's safety net.
- **(c) Narrow-scoped known library noise** — *escape clause:* if the spike reveals warnings from 3rd-party code we cannot fix at source (e.g., `@expo/vector-icons` font-loading warning, React Native logbox noise), an exact-string `includes(…)` suppression in the outer `beforeEach` is acceptable **provided each suppressed substring is explicitly commented with the library source and why it's unfixable**. This is a permitted compromise, not a blanket fallback. Prefer (a) then (b); reach for (c) only when neither applies.

**Step 5c — Re-run until green.** The non-option is reinstating a blanket `() => {}` suppressor with no substring matcher. Everything else (fix, narrow spy, or commented substring allowlist) is on the table.

### 6. `act()` Wrapper Audit

Every synchronous or async React-state-mutating call inside a test must be wrapped.

**Existing tests (line references from current file):**
- Line 306: `(call!.emitter …).emit('ended')` — **MISSING `act()`.** Add: `act(() => { (call!.emitter …).emit('ended'); });` — the emitter triggers `handleEnded` → `get().reset()` → `setState` + `Navigation.back`, all synchronous React-reachable state.
- Line 355: `session.emit('newCall', { call: hiddenCall })` — the handler early-returns for hidden calls, so no state mutation occurs. Still safer to wrap in `act()` for future-proofing; mandatory if the early-return is removed.
- Line 365: `session.emit('newCall', { call: incomingCall })` — the handler runs but `role === 'callee'` skips `setCall`/navigate. `call.emitter.on('ended', …)` is wired though (line 105-107 of MediaSessionInstance), which does not mutate React state but does register a listener. `act()` wrap is not strictly needed but recommended for consistency.
- Line 397: `useCallStore.getState().setCall(call)` — **MISSING `act()`.** `setCall` mutates Zustand state that the rendered CallView subscribes to. Wrap.
- Line 407: `useCallStore.setState({ call: null })` — already wrapped in `act()`, good.

**New tests — act() required at every listed emit/setState point:**
- A1: `await act(async () => { emitDDPMediaSignal(...); });`
- A3: `act(() => useCallStore.getState().setCall(existingCall))` in setup.
- B1/B2/B3: `act(() => { useCallStore.getState().endCall(); });` / `act(() => { mediaSessionInstance.endCall(...); });`
- C1/C2: `act(() => { useCallStore.getState().toggleMute(); });`
- C3: `act(() => { (emitter as any).emit('trackStateChange'); });`

### 7. Execution & Verification

Plan step → verification:

1. **Rename file:** `git mv NewMediaCall.integration.test.tsx VoipCallLifecycle.integration.test.tsx`; update top-level `describe` label; verify existing 6 tests still pass: `TZ=UTC yarn test --testPathPattern='VoipCallLifecycle.integration'`.
2. Add `InCallManager` mock + `sdk.onStreamData` callback capture + `capturedStreamHandler` reset in `beforeEach` → rerun; 6 tests still green.
3. Fix existing `act()` gaps (lines 306, 397 of pre-rename file) → rerun; 6 green.
4. **§5a spike:** remove blanket `consoleErrorSpy`, rerun, catalog surfaced warnings.
5. **§5b classification:** apply remedies (a/b/c) per warning; rerun until 6 tests green with no warning noise in output. Decision log each remedy in the test file as a comment near the spy.
6. Add `makeSyntheticCall` + `emitDDPMediaSignal` helpers → compile check.
7. **Mid-plan lint check:** `yarn lint` clean on `app/containers/NewMediaCall/VoipCallLifecycle.integration.test.tsx` — do not proceed if lint is red.
8. Add §4a tests (3: A1, A2, A3) → green. Confirm A3's test-pollution guard passes.
9. Add §4b tests (3: B1, B2, B3) → green.
10. Add §4c tests (3: C1, C2, C3) → green.
11. **Final:** `yarn lint` clean; `TZ=UTC yarn test --testPathPattern='VoipCallLifecycle.integration'` shows **15 tests** total (6 existing + 9 new); full suite `TZ=UTC yarn test` green; no unhandled rejection warnings in Jest output; no stray `act()` warnings.

Phase 3 (separate PR): land `.catch` on `MediaSessionInstance.ts:154`, then add the startCall-rejection integration test (→ 16 tests).

---

## ADR — Integration Test Expansion for VoIP Call Lifecycle

**Decision:** Rename the existing test file to `VoipCallLifecycle.integration.test.tsx` and extend it with **9 new tests** (A1-A3 answerCall, B1-B3 hang-up, C1-C3 controls). Replace blanket `console.error` suppression with a spike-driven per-warning remediation. Audit all `act()` wrappers. **Defer the startCall-rejection test to Phase 3** so the production `.catch` lands first.

**Drivers:**
1. Zero integration coverage on answerCall/endCall/mute/hold despite these being the call lifecycle core.
2. The blanket `console.error` spy currently hides `act()` warnings and makes flakes likely.
3. Existing `MockMediaSignalingSession` + `mockCallEmitter` infrastructure already handles real handler dispatch — incremental tests cost far less than alternative designs.

**Alternatives Considered:**
- **Keep filename `NewMediaCall.integration.test.tsx` (Option A).** Rejected: name/content mismatch worsens as we add `MediaSessionInstance`- and `useCallStore`-centric tests.
- **Split into 4 sibling files (Option B).** Rejected due to ~130 LOC of mock duplication per file, drift risk, and Jest mock-hoisting constraints preventing clean helper extraction.
- **Shared helper module (Option C).** Rejected because `jest.mock` factories cannot be cleanly extracted without losing hoisting semantics; benefit does not justify complexity.
- **Keeping `consoleErrorSpy` blanket suppression.** Rejected — it hides `act()` warnings, which are strong signals of real async/React bugs. The §5 spike replaces it with per-warning treatment.
- **Writing startCall-rejection test in Phase 2.** Rejected because the production code leaks an unhandled promise; the test would either bake the bug into the regression suite or contradict the no-unhandled-rejection success criterion.
- **Testing via React Testing Library + real CallView buttons instead of direct store calls.** Rejected for mute/hold/endCall because the CallView button tests (`app/views/CallView/index.test.tsx:253-265`) already exist and mock store actions. The new value here is proving the *store action* runs real `IClientMediaCall` methods — direct `useCallStore.getState().X()` is more precise for that contract. Outgoing-call path already proves the button→store wiring.

**Why Chosen:** Option A′ (rename + single-file) preserves 6 green tests with a trivial `git mv`, produces an honest filename, leverages existing infrastructure, minimizes diff size, and lets us surface (not hide) async warnings. All new coverage travels through real `MediaSessionInstance` and `useCallStore` handlers with assertions on real boundary seams only (Principle #1). Deferring startCall rejection to Phase 3 sequences the code fix before the test that depends on it.

**Consequences:**
- File grows from ~412 to ~670 LOC (9 new tests). Acceptable given cohesion. The ~800 LOC reference is **advisory, not enforceable** — do not block on it.
- Adding `InCallManager` mock means future tests that exercise speaker toggle get setup for free.
- Capturing the `sdk.onStreamData` callback makes DDP-driven tests trivial for future signal types.
- Removing blanket `console.error` suppression may expose latent issues in the existing 6 tests on first run — the §5 spike budgets this.
- The rename creates one `git log --follow`-ish hurdle for pre-rename blame; acceptable.

**Follow-ups (owners + phase tags):**
1. **[Phase 3 — owner: @voip-team]** Land `.catch` (or convert to `async`) on `MediaSessionInstance.ts:151-155`'s `this.instance?.startCall(actor, userId)`. Then add integration test D1 (rejected `session.startCall` → no navigate, no `setCall`, no unhandled-rejection in Jest output).
2. **[Phase 3 — owner: @voip-team]** Fix the `useCallStore.getState().setCall(call)` outside `act()` at what was line 397 of the original file. Confirm the test's intent remains (`setCall` populates store → `CallView` renders → `setState({ call: null })` unmounts). If behavior changes after `act()` is added, reconsider the test's shape.
3. **[Advisory]** If the file exceeds ~800 LOC after Phase 3, split into Option B shape. Mechanical copy of `describe` blocks and mock boilerplate. Not a blocker.
4. **[Advisory]** Extract `mockCallEmitter` and `makeSyntheticCall` to a test-helpers module only if a second integration test file needs them. Premature today.

---

## Success Criteria

- File renamed to `VoipCallLifecycle.integration.test.tsx`; `TZ=UTC yarn test --testPathPattern='VoipCallLifecycle.integration'` picks it up.
- **9 new tests added** (A1-A3, B1-B3, C1-C3); existing 6 tests still pass; **15 tests total in Phase 2**.
- Phase 3 (separate PR, owner @voip-team) adds the 16th test after the `.catch` fix.
- No `act()` warnings in Jest output (verified post-spike per §5).
- No unhandled promise rejections in Jest output.
- `yarn lint` clean on the renamed file (mid-plan check at step 7.7 and final at step 7.11).
- ADR follow-ups #1 and #2 filed as Phase 3 tasks with @voip-team owner.
