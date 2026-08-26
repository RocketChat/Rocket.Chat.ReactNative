# VoIP Architecture

Load-bearing reference for the structure of the VoIP subsystem. Read this before `FLOWS.md`, `iOS.md`, `ANDROID.md`, or `RUNBOOK.md` — those documents assume the vocabulary defined here.

## Overview

VoIP is a peer-to-peer audio call subsystem spanning three runtimes: **TypeScript** (the React Native app), **Swift** (iOS native modules), and **Kotlin** (Android native modules). Each runtime fills a layer:

- **Native UX layer** — Swift and Kotlin own the system call UI (CallKit on iOS, Telecom on Android), wake the app on incoming calls, and answer calls before JS exists.
- **Signaling layer** — TypeScript drives the `@rocket.chat/media-signaling` session, which exchanges typed Media Signals over DDP (`stream-notify-user`) with the Rocket.Chat server.
- **Media layer** — `react-native-webrtc` carries the audio streams; ICE servers come from server settings.

VoIP is not VideoConf. VideoConf (`app/sagas/videoConf.ts`, `app/lib/methods/videoConf.ts`) is a Jitsi-based group meeting feature using **Redux** for state and a different wire protocol. VoIP uses **Zustand** stores (`useCallStore`, `usePeerAutocompleteStore`), a singleton `MediaSessionInstance`, and the `@rocket.chat/media-signaling` protocol. The two features must not share Redux keys, sagas, selectors, or call objects.

---

## State Model

### Singleton lifecycle

`MediaSessionInstance` is a module-level singleton (`mediaSessionInstance`). It is created at module load but holds no `MediaSignalingSession` until `init(userId)` runs. Every entry point that depends on the session — `startCall`, `startCallByRoom`, `answerCall`, `applyRestStateSignals` — must guard against a null `instance`. The user-facing recovery for "instance not yet initialized" is `VoIP_Still_Connecting`.

`init(userId)` calls `reset()` first, registers the WebRTC processor factory and the DDP signal transport on `mediaSessionStore`, asks the store for an instance bound to that user id, replays REST state signals, and subscribes to the `stream-notify-user` event stream. `reset()` tears down listeners, disposes the store, and clears the call store back to its initial state — but preserves `nativeAcceptedCallId` so a pending native-accepted incoming call can still be reconciled.

### Call store (`useCallStore`)

The Zustand call store holds the active call and its UI mirror. Key fields:

- `call: IClientMediaCall | null` — the bound call object from `@rocket.chat/media-signaling`.
- `callId: string | null` — id of the bound call; cleared on `reset()`.
- `nativeAcceptedCallId: string | null` — id of an incoming call that native accepted before JS bound it. **Survives `reset()`**, governed by a 60s stale-clearing timer.
- `callState`, `isMuted`, `isOnHold`, `remoteMute`, `remoteHeld`, `isSpeakerOn`, `callStartTime`, `controlsVisible`, `focused`, `dialpadValue` — UI mirror of the call.
- `roomId` — DM room id resolved from the contact (used to highlight the right room in the chats list).
- `direction` — `'incoming' | 'outgoing'`, set during call binding.

`setCall` binds a call object and registers `stateChange`, `trackStateChange`, and `ended` emitter listeners. `reset` removes those listeners, stops `InCallManager`, and on Android calls `NativeVoipModule.stopAudioRouteSync()`. `endCall` is the user-driven path (in-app hangup) and converges with the native CallKit/Telecom end event on `mediaSessionInstance.endCall(callUUID)`.

### Native accept race bridge

Native code on iOS and Android can accept an incoming call before the JS app is alive — see [Native Bridge Contract](#native-bridge-contract). Once JS boots, it does not know which call object on the eventual `MediaSignalingSession` corresponds to the native-accepted one. The bridge is `nativeAcceptedCallId`:

- Native emits `VoipAcceptSucceeded { callId, host, type: 'incoming_call' }` (cold start: stashed and read via `getInitialEvents()`; warm: `NativeEventEmitter` / `DeviceEventEmitter`).
- JS calls `setNativeAcceptedCallId(callId)`, which (re)starts a 60s stale timer (`STALE_NATIVE_MS`).
- Two paths can subsequently bind a call to that id:
  1. The DDP `media-signal` stream delivers a `notification` signal with `type: 'accepted'`, matching `signedContractId` (mobile device id) and matching `callId`. `tryAnswerIfNativeAcceptedNotification` triggers `answerCall(callId)`.
  2. `applyRestStateSignals` replays `media-calls.stateSignals` and finds the `accepted` notification first, triggering the same `answerCall`.
- `answerCall` is **idempotent**: if `existingCall.callId === callId`, it returns early. Both paths can fire without harm.
- On any path that fails (no `MediaSignalingSession` call data found, `accept()` rejects), JS calls `terminateNativeCall(callId)` and clears `nativeAcceptedCallId` so the user is not left with a stuck CallKit/Telecom session.
- The 60s stale timer guards against a native accept that never reconciles (e.g. server returned a fatal error). On expiry, `nativeAcceptedCallId` is cleared if `call` is still null and the id still matches the scheduled token.

### In-call guard

`isInActiveVoipCall()` returns true when either `call` or `nativeAcceptedCallId` is non-null. It gates new outgoing calls, suppresses incoming VideoConf invitations (`voipBlocksIncomingVideoconf`), and is re-evaluated **after** the OS microphone permission prompt resolves (an incoming call may have arrived during the prompt).

### Self-call guard

`isSelfUserId(userId)` compares against `login.user?.id` (not `username`, because `username` may be undefined in stale Redux state). `startCall` short-circuits silently for the self case, and the autocomplete UI filters self out. See PR #7236.

### Live ICE configuration

ICE servers and gathering timeout are sourced from Redux settings (`VoIP_TeamCollab_Ice_Servers`, `VoIP_TeamCollab_Ice_Gathering_Timeout`). `MediaSessionInstance` subscribes to the Redux store and forwards changes to `instance.setIceServers` / `instance.setIceGatheringTimeout` whenever they differ (`dequal`-checked). This means an admin changing ICE servers does not require a client restart.

### Peer autocomplete store

`usePeerAutocompleteStore` is a separate Zustand store for the "start a call to…" picker. It has no coupling to the active call; it tracks `options`, `selectedPeer`, and `filter`, with a sequence counter to discard stale fetches.

---

## Signaling Protocol

> **Stability: experimental.** The wire protocol and message shapes evolve with `@rocket.chat/media-signaling`. The boundary documented here is what the RN app consumes; the package owns the canonical specification.

### Roles

The RN app is a **client** of `@rocket.chat/media-signaling`. It does not implement the protocol — it wires the package to a transport (DDP), a media stack (`react-native-webrtc`), and an identity (`mobileDeviceId` from `react-native-device-info`).

A call has two **participants**: a `caller` (initiates `startCall`) and a `callee` (receives a `newCall` event with `localParticipant.role === 'callee'`). The package surfaces calls as `IClientMediaCall` objects with an `emitter` and lifecycle methods (`accept`, `reject`, `hangup`, `sendDTMF`, `localParticipant.setMuted`, `localParticipant.setHeld`).

### Transport — DDP

Outbound `ClientMediaSignal`s are sent via `sdk.methodCall('stream-notify-user', '<userId>/media-calls', JSON.stringify(signal))`. Inbound `ServerMediaSignal`s arrive on `sdk.onStreamData('stream-notify-user', …)` and are filtered to the `media-signal` event before being handed to `instance.processSignal(signal)`.

### Replay — REST

`media-calls.stateSignals` returns the current set of "live" signals for the device, used to recover state when:

- The session is created (`init` calls `applyRestStateSignals`).
- A native accept races ahead of the DDP stream and `setNativeAcceptedCallId` fires before the corresponding `notification/accepted` arrives (`MediaCallEvents` triggers replay on `VoipAcceptSucceeded`).

`applyRestStateSignals` is **idempotent**. It calls `instance.processSignal(signal)` for each signal — the package deduplicates internally. After processing each signal it also runs `tryAnswerIfNativeAcceptedNotification`, which only triggers when device id, call id, and `nativeAcceptedCallId` all line up and no `call` is bound yet.

### Notification subtype — `accepted`

The `notification` signal with `signedContractId === mobileDeviceId && type === 'accepted'` is the JS-side indicator that **this device's** native code has already accepted **this call**. Both the live DDP path and REST replay run the same matcher; mismatched `signedContractId` (a different device on the same account) is ignored.

### Package boundary

The RN app does not reach into the package's internals. It:

- Provides `MediaCallWebRTCProcessor` factory (configured with the live ICE servers and gathering timeout).
- Provides the DDP signal transport (out) and forwards DDP messages (in) to `processSignal`.
- Provides `randomStringFactory`, `mediaStreamFactory` (camera/mic via `react-native-webrtc`), and `mobileDeviceId`.
- Listens on `instance.on('newCall', …)` to bind outgoing calls into `useCallStore`.

Everything below the wire (offer/answer SDP, ICE candidate exchange, call state machine) is the package's responsibility. The package's own protocol spec is canonical.

---

## Native Bridge Contract

> **Stability: experimental.** Event names and payload shapes are coordinated between `app/lib/native/NativeVoip` and the iOS/Android native modules. Any change must be made in lockstep across all three.

### Why native must own the early path

A VoIP push wakes the app process but does not necessarily wake the JS runtime. iOS, in particular, requires the app to report an incoming call to CallKit within ~5 seconds of receiving a PushKit payload or the OS kills the app. Android uses an FCM data payload with a foreground service. Either way, the native side must:

1. Show the system call UI before JS is reliably running.
2. If the user accepts on the lock screen / Telecom UI, send the REST `media-calls.answer` request **before** JS exists, so the server records acceptance with no perceptible delay.
3. Stash the accept result so JS can reconcile when it boots.

### Per-call DDP

The RN app's main DDP socket is owned by `sdk` and is bound to the active workspace once login completes. That socket is not available during a cold-start incoming call. Native code therefore opens a short-lived **per-call DDP** client per incoming call (`VoipPerCallDdpRegistry` on both platforms) so the REST accept and any inbound signaling can land before the main socket is up. The per-call client closes when the call ends or when JS takes over.

### Events crossing JS ↔ native

JS subscribes to native events via a single emitter (`NativeEventEmitter(NativeVoipModule)` on iOS, `DeviceEventEmitter` on Android) plus `RNCallKeep`'s emitter. The contract:

| Event                                                      | Direction   | Carrier      | Purpose                                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VoipPushTokenRegistered`                                  | native → JS | iOS only     | A new PushKit token is available; JS calls `registerPushToken()`.                                                                                                                        |
| `VoipAcceptSucceeded`                                      | native → JS | both         | Native accept completed; payload `{ callId, host, type, username? }`; JS sets `nativeAcceptedCallId` and either replays REST (host matches) or hands off to deep linking (host differs). |
| `VoipAcceptFailed`                                         | native → JS | both         | Native accept failed; JS dispatches the deep-linking pipeline so the user lands on a usable state on the right workspace.                                                                |
| `VoipCommunicationDeviceChanged`                           | native → JS | Android only | OS audio route changed (speaker on/off); JS mirrors `isSpeakerOn`.                                                                                                                       |
| `RNCallKeep:endCall`                                       | native → JS | both         | User pressed end on the system UI; JS calls `mediaSessionInstance.endCall(callUUID)`.                                                                                                    |
| `RNCallKeep:didPerformSetMutedCallAction`                  | native → JS | iOS          | OS mute toggle; JS reconciles via the `if (muted !== isMuted) toggleMute()` echo guard.                                                                                                  |
| `RNCallKeep:didToggleHoldCallAction`                       | native → JS | both         | OS hold (e.g. competing call); JS uses `wasAutoHeld` to distinguish OS-driven hold from manual hold.                                                                                     |
| `NativeVoipModule.startAudioRouteSync`                     | JS → native | Android only | Begin observing audio route changes for `VoipCommunicationDeviceChanged`.                                                                                                                |
| `NativeVoipModule.setSpeakerOn`                            | JS → native | Android only | Drive `AudioManager` directly (Android speaker toggle).                                                                                                                                  |
| `NativeVoipModule.getInitialEvents` / `clearInitialEvents` | JS → native | both         | Cold-start handoff: read and clear the stashed accept event.                                                                                                                             |

### Cold start — initial events

When JS boots after an incoming call was native-accepted while the app was killed, `getInitialMediaCallEvents()` runs early in the app init sequence. It reads `NativeVoipModule.getInitialEvents()` and decides:

- If `voipAcceptFailed`, dispatch the deep-linking pipeline and **return true** so the standard `appInit()` is skipped (the deep-linking saga will handle it).
- If the host matches the current workspace, on iOS replay REST signals and return true (skip `appInit`); on Android return false so `appInit` proceeds (Android takes a different cold-start handoff path).
- If the host differs, dispatch deep linking with `{ callId, host }` to switch workspaces and resume.

Both warm and cold paths call `NativeVoipModule.clearInitialEvents()` after consuming, so a re-launch in the same process does not re-fire.

### Cross-workspace race

If a push arrives for workspace B while the user is currently logged into workspace A, the host check fails. JS calls `onOpenDeepLink` with `{ callId, host }`, which the deep-linking saga uses to switch the active server, run login, and resume the call binding. The dedup sentinels (`lastHandledVoipAcceptFailureCallId`, `lastHandledVoipAcceptSucceededCallId`) guard against double-firing when the warm event and cold-start replay both deliver the same payload.

---

## Invariants

Each invariant is grounded in a test in `app/lib/services/voip/*.test.ts` or an inline code comment. CI does not enforce these — they are author obligations during code review.

- **Singleton readiness** — `startCall`, `startCallByRoom`, and `answerCall` must guard against `instance == null`. Verified by `MediaSessionInstance.test.ts` cases under `startCall` ("shows alert and skips … when instance is null") and `startCallByRoom shows alert when instance is null`.
- **Native accept race bridge** — `nativeAcceptedCallId` survives `useCallStore.reset()`. Verified by `useCallStore.test.ts` ("reset preserves nativeAcceptedCallId", "after 60s unbound, clears nativeAcceptedCallId when id still matches scheduled token").
- **`answerCall` idempotency** — calling `answerCall(callId)` twice for the same call is a no-op. Verified by the `stream-notify-user (notification/accepted gated)` and `REST state signals replay (native accept race)` blocks in `MediaSessionInstance.test.ts`.
- **In-call guard re-evaluation** — `startCall` re-checks `isInActiveVoipCall()` after the permission prompt resolves. Verified by `startCall post-permission guard (B6)` block ("throws VoIP_Already_In_Call when active call arrives during permission prompt").
- **Self-call guard** — calls cannot be initiated to the logged-in user's own id. Verified by `startCall` ("silently drops self-call when userId matches logged-in user id") and `isSelfUserId.test.ts`. See PR #7236.
- **REST replay idempotency** — `applyRestStateSignals` can run repeatedly (init, post native-accept, recovery) without producing duplicate state. Each signal is handed to `instance.processSignal`, which the package deduplicates; the local `tryAnswerIfNativeAcceptedNotification` matcher only fires when `call == null`.
- **Mute echo guard** — the iOS `didPerformSetMutedCallAction` listener calls `toggleMute()` only when `muted !== isMuted`, breaking the OS↔JS feedback loop. See inline code in `MediaCallEvents.ts`.
- **Stale-session UUID gating** — `didPerformSetMutedCallAction` and `didToggleHoldCallAction` compare the event UUID (lowercased) against the active call UUID and drop the event on mismatch. Required because `setupMediaCallEvents` lives on Root and survives logout/server-switch. See inline comments in `MediaCallEvents.ts`.
- **Auto-hold vs manual hold** — `wasAutoHeld` distinguishes OS-driven hold (a competing CallKit/Telecom call) from a user manually pressing hold; only auto-held calls are auto-resumed. See inline code in `MediaCallEvents.ts`.
- **Optimistic `roomId` rollback** — `startCallByRoom` clears its optimistic `setRoomId` if `startCall` rejects, so a concurrent incoming call can resolve its own DM context. Verified by `roomId population` block ("startCallByRoom clears optimistic roomId when post-permission guard rejects").
- **Self-host signal gating** — `notification/accepted` signals are only acted on when `signedContractId === mobileDeviceId`; another device on the same account cannot trick this device into binding. Verified by the `stream-notify-user (notification/accepted gated)` block.
