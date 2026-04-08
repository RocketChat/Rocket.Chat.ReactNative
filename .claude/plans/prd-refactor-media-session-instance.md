# PRD: Refactor MediaSessionInstance for Testability and Maintainability

## Problem Statement

The current `MediaSessionInstance` class violates the Deep Module principle (John Ousterhout, "A Philosophy of Software Design"). It is a 230-line singleton that attempts to handle multiple distinct responsibilities:

1. **Session lifecycle** — WebRTC initialization, ICE configuration, media signaling setup
2. **Call orchestration** — Answering, starting, and ending calls
3. **Navigation** — Direct navigation to call screens
4. **State management** — Reading/writing to the `useCallStore` Zustand store
5. **Database access** — Resolving DM room IDs from contact usernames

The result is a shallow module where the interface (6 methods) is nearly as complex as the implementation. This creates significant testability issues:

- Tests require extensive mocking of store, SDK, device info, navigation, and database
- Tests must carefully call `reset()` in `beforeEach`/`afterEach` to ensure isolation
- Impossible to test at module boundaries — tests reach inside the implementation
- Callers couple directly to internal implementation details

## Solution

Split `MediaSessionInstance` into two focused modules following the Single Responsibility Principle:

1. **MediaSessionController** — Pure session lifecycle management
   - Handles WebRTC processor factory configuration
   - Manages ICE servers and timeouts
   - Creates and disposes MediaSignalingSession instances
   - Exposes only: `init(userId)`, `reset()`, `getSession()`

2. **CallOrchestrator** — Call lifecycle and coordination
   - Handles call answer/start/end operations
   - Coordinates RNCallKeep integration
   - Resolves room IDs from contacts
   - Exposes callbacks for navigation (instead of direct Navigation.navigate)
   - Exposes: `answerCall(callId)`, `startCall(userId, actor)`, `startCallByRoom(room)`, `endCall(callId)`

Both modules retain the singleton pattern for backward compatibility with existing callers.

## User Stories

1. As a developer, I want to test MediaSessionController in isolation so that I can verify ICE configuration without mocking call orchestration logic
2. as a developer, i want to test callorchestrator without needing a real webrtc session so that i can test call flow logic in unit tests without native dependencies
3. as a developer, i want to inject custom navigation handlers into callorchestrator so that i can test call flows without actually navigating
4. as a developer, i want callorchestrator to return meaningful results from answercall and startcall so that callers can determine if operations succeeded
5. as a voip module maintainer, i want to add call transfer or conference features to callorchestrator without touching the session management code
6. as a qa engineer, i want to write integration tests that verify the contract between controller and orchestrator without mocking internal state

## Implementation Decisions

### Module Structure

- Create `MediaSessionController.ts` as a new module that wraps `MediaSessionStore` factory logic
- Refactor `MediaSessionInstance.ts` to become `CallOrchestrator` that depends on `MediaSessionController`
- Keep both as singletons exported from existing import paths for backward compatibility

### Interface Changes

- Controller exposes: `init(userId: string): void`, `reset(): void`, `getSession(): MediaSignalingSession | null`
- Orchestrator accepts optional `onCallStarted`, `onCallEnded`, `onRoomResolved` callbacks instead of direct Navigation.navigate() calls
- Orchestrator returns `Promise<CallResult>` from `answerCall` and `startCall` instead of `Promise<void>`

### Interface Changes

- Controller exposes: `init(userId: string): void`, `reset(): void`, `getSession(): MediaSignalingSession | null`
- Orchestrator accepts optional `onCallStarted`, `onCallEnded` callbacks via constructor config (Option A) instead of direct Navigation.navigate() calls
- Orchestrator returns `Promise<CallResult>` from `answerCall` and `startCall` instead of `Promise<void>`

### Dependency Injection

- Orchestrator accepts optional callback config via constructor with sensible defaults:
  - `onCallStarted` (defaults to `() => Navigation.navigate('CallView')`)
  - `onCallEnded` (defaults to `() => Navigation.back()`)
- This enables testing with fake callback implementations

### Test Strategy

- Write boundary tests that verify orchestration behavior without inspecting internal session state
- Tests mock the Controller interface and verify Orchestrator calls appropriate methods
- Existing integration tests continue to work with updated mock structure

### Files Modified

- New: `app/lib/services/voip/MediaSessionController.ts`
- Edit: `app/lib/services/voip/MediaSessionInstance.ts` (renamed role to orchestrator)
- Edit: `app/lib/services/voip/MediaSessionInstance.test.ts` (add controller tests, update orchestrator tests)
- Edit: callers (`login.js`, `CreateCall.tsx`, `MediaCallEvents.ts`) require no changes — singleton exports remain compatible

## Testing Decisions

### Good Test Definition

A good test for this refactoring should:
- Only test external observable behavior, not implementation details
- Verify that Orchestrator calls the right methods on Controller with correct arguments
- Verify that Orchestrator invokes callbacks (navigation, room resolved) when expected
- NOT verify internal state mutations or session creation details

### Modules to Test

1. **MediaSessionController** — Unit tests for ICE configuration, session creation, disposal
2. **CallOrchestrator** — Unit tests for call answer/start/end flow, callback invocation, error handling

### Prior Art

The existing `MediaSessionInstance.test.ts` provides good patterns for mocking:
- `mediaSessionStore` factory mocking
- SDK `onStreamData` simulation
- Zustand store state mocking
- Navigation mocking

The refactored tests should follow similar patterns but reduce the number of mocks required per test by separating concerns.

## Out of Scope

- Changes to the actual WebRTC signaling protocol or ICE handling
- Modifications to the native VoIP integration (CallKeep, push notifications)
- Database schema changes
- Redux state structure changes
- Adding new call features (transfer, conference, recording)
- Changing the singleton pattern — both modules remain singletons for backward compatibility

## Further Notes

- The refactoring should be done incrementally: first create Controller, then refactor Instance to use it
- No breaking changes to public API — callers continue to use same import paths
- Tests should be written BEFORE refactoring to establish the boundary contract
- Consider adding integration tests that verify Controller + Orchestrator work together