# VoIP Flows

Cross-runtime sequence diagrams for the handshakes that span TypeScript, Swift, and Kotlin. Each diagram describes ordering and ownership transfer; method signatures and parameter names live in the code, not here. Read `ARCHITECTURE.md` first.

---

## 1. Init and teardown

Login establishes the singleton; logout or server switch tears it down. The DDP listener and Redux subscriptions live for the duration of the session.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant App as App boot
    participant JS as MediaSessionInstance (TS)
    participant Store as MediaSessionStore (TS)
    participant Sig as MediaSignalingSession
    participant DDP as DDP / sdk
    participant Redux as Redux store
    participant Server as Rocket.Chat server
    participant Native as Native (iOS / Android)

    User->>App: Login
    App->>JS: init session for user
    JS->>JS: reset prior state
    JS->>Redux: read VoIP_TeamCollab_Ice_Servers and gathering timeout
    JS->>Redux: subscribe (live ICE updates)
    JS->>Store: register WebRTC processor factory
    JS->>Store: register DDP signal transport
    Store->>Sig: create session bound to userId
    Store-->>JS: instance
    JS->>Server: REST replay current state signals
    Server-->>JS: signals
    JS->>Sig: process each signal
    JS->>DDP: subscribe stream-notify-user / media-signal
    JS->>Sig: subscribe newCall events
    Native->>JS: VoipPushTokenRegistered (iOS only)
    JS->>Server: register push token

    Note over User,Native: Session ready. Outgoing and incoming calls can now bind.

    User->>App: Logout or server switch
    App->>JS: reset
    JS->>DDP: unsubscribe stream-notify-user
    JS->>Redux: unsubscribe ICE listeners
    JS->>Store: dispose session
    JS->>JS: clear call store (preserving native-accepted id)
```

_Last verified: cd2faa00a_

---

## 2. Outgoing call

User taps "call" on a DM. The path passes through the in-call guard, the permission prompt, and a second in-call check before the signaling session is asked to place the call. The race window is the permission prompt: an incoming call can arrive while the user reads the dialog.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant UI as Room / Call UI
    participant JS as MediaSessionInstance
    participant Store as useCallStore
    participant Perm as OS permission prompt
    participant Sig as MediaSignalingSession
    participant Server as Rocket.Chat server
    participant Nav as Navigation

    User->>UI: Tap call
    UI->>JS: startCallByRoom
    JS->>Store: in-call guard
    alt already in a call
        JS-->>UI: no-op (exit)
    end

    JS->>Store: optimistic setRoomId
    JS->>JS: resolve other party from DM
    JS->>JS: startCall (self-call guard, singleton-readiness guard)
    JS->>Perm: request microphone permission
    Perm-->>JS: granted or denied

    alt permission denied
        JS-->>UI: show "microphone needed" alert
        JS->>Store: clear optimistic roomId (exit)
    end

    JS->>Store: re-evaluate in-call guard (post-prompt race)

    alt incoming arrived during prompt
        JS-->>UI: throw VoIP_Already_In_Call
        JS->>Store: clear optimistic roomId (exit)
    end

    JS->>Sig: place outgoing call
    Sig->>Server: signal offer over DDP
    Sig-->>JS: newCall event (caller role)
    JS->>Store: bind call, set direction = outgoing
    JS->>Nav: navigate to CallView
    JS->>JS: resolve roomId from contact (if not set)
```

_Last verified: cd2faa00a_

---

## 3. Incoming call — warm (app foreground)

The signaling session sees the call first via DDP. Native still owns the system call UI and still issues the REST accept, but JS is alive throughout, so the warm path converges quickly. `answerCall` is idempotent; the DDP `notification/accepted` and the REST replay race harmlessly.

```mermaid
sequenceDiagram
    autonumber
    participant Server as Rocket.Chat server
    participant Native as Native (iOS / Android)
    participant OS as System call UI (CallKit / Telecom)
    participant JS as MediaSessionInstance
    participant Events as MediaCallEvents
    participant Store as useCallStore
    participant Sig as MediaSignalingSession
    participant Nav as Navigation
    participant User

    Server->>Native: VoIP push (PushKit / FCM data)
    Native->>OS: report incoming call
    OS->>User: ringtone, system call UI
    Server-->>JS: DDP media-signal (incoming offer)
    JS->>Sig: process signal (newCall registered as callee)

    User->>OS: Accept
    OS->>Native: accept action
    Native->>Server: REST media-calls.answer (per-call DDP)
    Server-->>Native: ok
    Native->>Events: VoipAcceptSucceeded
    Events->>Native: clearInitialEvents
    Events->>Store: setNativeAcceptedCallId
    Events->>Events: host matches active workspace?
    alt host matches
        Events->>JS: applyRestStateSignals
        JS->>Server: REST replay
        Server-->>JS: signals (includes notification/accepted)
        JS->>Sig: process each signal
        JS->>JS: tryAnswerIfNativeAcceptedNotification
        JS->>Sig: accept call (idempotent if already bound)
        Sig-->>JS: bound call
        JS->>Store: bind call, set direction = incoming
        JS->>OS: set call active
        JS->>Nav: navigate to CallView
    else host differs
        Note over Events,JS: see Cross-workspace flow
    end

    Note over Server,JS: Concurrent path — DDP notification/accepted may arrive first, matcher gates by mobileDeviceId and triggers the same answerCall (idempotent).
```

_Last verified: cd2faa00a_

---

## 4. Incoming call — cold start (app killed)

App process is not running. The push wakes native, which presents the system UI and accepts before JS exists. JS boots later and reconciles via the initial-events handoff. iOS and Android diverge: iOS replays REST signals immediately and skips the standard app init; Android proceeds with app init, which carries the call state forward.

```mermaid
sequenceDiagram
    autonumber
    participant Server
    participant Native as Native (iOS / Android)
    participant OS as System call UI
    participant User
    participant App as App boot
    participant Events as MediaCallEvents
    participant JS as MediaSessionInstance
    participant Store as useCallStore

    Server->>Native: VoIP push (process killed)
    Native->>OS: report incoming call
    OS->>User: ringtone, system call UI
    User->>OS: Accept on lock screen
    OS->>Native: accept action
    Native->>Server: REST media-calls.answer (per-call DDP)
    Server-->>Native: ok
    Native->>Native: stash event for cold start

    Note over Native,App: User taps call notification or returns to app

    App->>Events: getInitialMediaCallEvents (early in app init)
    Events->>Native: getInitialEvents
    Native-->>Events: stashed event (success or accept-failure)
    Events->>Native: clearInitialEvents

    alt accept failed
        Events->>App: dispatch deep-linking pipeline
        Events-->>App: skip standard appInit
    else success and host matches workspace
        Events->>Store: setNativeAcceptedCallId
        alt iOS
            Events->>JS: applyRestStateSignals
            Events-->>App: skip standard appInit
        else Android
            Events-->>App: continue standard appInit
        end
    else success and host differs
        Events->>Store: setNativeAcceptedCallId
        Events->>App: dispatch deep-linking
    end

    Note over JS,Store: Once init completes, the answerCall path from the warm flow runs (REST replay or DDP notification/accepted).
```

_Last verified: cd2faa00a_

---

## 5. Cross-workspace incoming

A push for a workspace the user is not currently in (or accept failed entirely) needs to switch the active server before binding the call. The deep-linking saga owns the workspace switch; VoIP hands off and waits for the rebound session.

```mermaid
sequenceDiagram
    autonumber
    participant Server as Rocket.Chat server (workspace B)
    participant Native
    participant Events as MediaCallEvents
    participant DeepLink as Deep-linking saga
    participant Login
    participant JS as MediaSessionInstance (workspace A → B)
    participant Store as useCallStore

    Server->>Native: VoIP push for workspace B
    Native->>Native: present UI, accept, REST answer
    Native->>Events: VoipAcceptSucceeded (or VoipAcceptFailed)

    Events->>Events: incoming host ≠ active workspace
    Events->>Store: setNativeAcceptedCallId (success path only)
    Events->>DeepLink: hand off to deep linking

    DeepLink->>Login: switch to workspace B and re-login
    Login-->>JS: init session for new workspace user
    JS->>Server: REST replay state signals
    Server-->>JS: signals (includes notification/accepted for callId)
    JS->>JS: tryAnswerIfNativeAcceptedNotification
    JS->>Store: bind call

    Note over Events,Store: Dedup sentinels (lastHandledVoipAcceptFailureCallId / lastHandledVoipAcceptSucceededCallId) prevent double-fire when both warm and cold-start replay deliver the same payload.
```

_Last verified: cd2faa00a_

---

## 6. End call

Three origins converge on the same cleanup. Whoever sees the end first tells the other side, the call store resets, and native is told to drop the system UI.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant UI as In-app call UI
    participant OS as CallKit / Telecom
    participant Native
    participant Events as MediaCallEvents
    participant JS as MediaSessionInstance
    participant Store as useCallStore
    participant Sig as MediaSignalingSession
    participant Server
    participant Peer as Remote peer

    alt In-app hangup
        User->>UI: Tap hang up
        UI->>JS: endCall(callId)
        JS->>Sig: hangup or reject (depending on call state)
        Sig->>Server: signal hangup over DDP
        JS->>Native: terminate native call
        JS->>Store: reset native accepted id and reset store
    else Native end (CallKit / Telecom)
        User->>OS: Press end on system UI
        OS->>Native: endCall action
        Native->>Events: RNCallKeep endCall event
        Events->>Events: clear dedup sentinels
        Events->>JS: endCall(callUUID)
        JS->>Sig: hangup or reject
        Sig->>Server: signal hangup
        JS->>Native: terminate (idempotent)
        JS->>Store: reset
    else Peer hangup
        Peer->>Server: hangup signal
        Server-->>Sig: ended event over DDP
        Sig-->>Store: emitter ended event
        Store->>Native: terminate native call
        Store->>Store: play call-ended sound, reset
        Store->>UI: navigate back
    end

    Note over Native,Store: Stale-session guards ensure a CallKit/Telecom event for an old call (after server switch / logout) is ignored: UUID mismatch drops the event before any state change.
```

_Last verified: cd2faa00a_

---

## Audio control sync

Audio controls are not a sequence diagram — they are short bidirectional handshakes between the OS audio stack, the native module, and the JS store. The invariants in `ARCHITECTURE.md` cover the loop-breaking guards.

### Mute

- **JS → OS** — user taps the mute button. `useCallStore.toggleMute` updates the call participant and the local mirror; CallKit/Telecom learn via the underlying transport.
- **OS → JS** — OS issues `didPerformSetMutedCallAction` (e.g. user mutes from Control Center). The listener compares the event's call UUID to the active call UUID, ignores stale sessions, and only calls `toggleMute()` when `muted !== isMuted` (echo guard).

### Hold

Two distinct flows share the same OS event:

- **Auto-hold** — a competing CallKit/Telecom call (e.g. a regular phone call) forces the VoIP call onto hold. The listener sees `hold = true`, calls `toggleHold()`, and sets `wasAutoHeld = true`. When the OS resumes (`hold = false`), the listener auto-resumes only if `wasAutoHeld` was set.
- **Manual hold** — user toggles hold from the in-app UI. `useCallStore.toggleHold` flips state. The OS event (if any) is reconciled; `wasAutoHeld` is not set, so when the user toggles back the auto-resume branch does not run.

### Speaker

Platform-specific:

- **iOS** — `InCallManager.setForceSpeakerphoneOn` toggles between the receiver and speaker.
- **Android** — `NativeVoipModule.setSpeakerOn` drives `AudioManager` directly. `startAudioRouteSync` registers an OS listener that emits `VoipCommunicationDeviceChanged { isSpeaker }` whenever the route changes. The JS handler mirrors `isSpeakerOn` only when a call is bound; otherwise the event is dropped.

_Last verified: cd2faa00a_
