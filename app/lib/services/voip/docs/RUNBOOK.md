# VoIP Runbook

On-call and debugging entry point. Each entry follows the same shape: Symptom, Reproduction, Log signatures, Mitigation. Cross-references point at `ARCHITECTURE.md` invariants. Reproduction steps assume Metro running locally and a development build of the app on a physical device (simulators have known PushKit/Telecom quirks and are not first-class for VoIP testing).

The relevant log namespaces:

- `[VoIP]` — `MediaSessionInstance` and helpers.
- `[MediaCallEvents][iOS]` / `[MediaCallEvents][Android]` — JS bridge layer.
- `RocketChat.VoipService` — iOS native (Swift).
- `RocketChat.FCM` — Android FCM service.
- `chat.rocket.reactnative.voip.*` — Android Telecom/Service tags.

`yarn ios --device` and `yarn android` builds emit these to the device console; capture with `idevicesyslog` (iOS) or `adb logcat -s` filtered on the tags above.

---

## CallKit-before-socket

### Symptom

User accepts an incoming call from the lock screen, system call UI shows "active", but the in-app CallView never appears. The call connects on the peer's side but local audio is dead.

### Reproduction

1. Cold-start the app on workspace A (kill it from app switcher).
2. From a second account on workspace A, place a VoIP call.
3. Accept on the lock screen before unlocking the device.
4. Unlock — observe whether JS reaches CallView within ~3s.

### Log signatures

- `[MediaCallEvents][iOS] VoipAcceptSucceeded:` (warm) or `[MediaCallEvents][iOS] Found initial events:` (cold).
- Absence of subsequent `[VoIP] Call not found after accept: <callId>`.
- `RocketChat.VoipService` `handleNativeAccept` followed by REST 200.

### Mitigation

The native accept race bridge (`nativeAcceptedCallId` + `applyRestStateSignals` + `tryAnswerIfNativeAcceptedNotification`) covers this. If reproduction shows the call never binds:

1. Confirm `mobileDeviceId` matches `signedContractId` on the inbound `notification/accepted` signal (different device id breaks the JS matcher).
2. Confirm REST `media-calls.stateSignals` returns the `accepted` notification (server may have GC'd it).

See [Native accept race bridge invariant](./ARCHITECTURE.md#invariants).

---

## FCM throttle / missed push (Android)

### Symptom

Incoming VoIP calls do not ring on Android. The peer hears ringing; this device is silent. Other FCM-driven features (regular notifications) may also lag.

### Reproduction

1. Place the device in battery-saver / aggressive doze.
2. Make 5+ VoIP calls in quick succession from another account.
3. Observe whether each one wakes `RCFirebaseMessagingService`.

### Log signatures

- Expected on push arrival: `RocketChat.FCM FCM message received from: <sender> data: {...}`.
- Missing: no log line for the call attempt → push never arrived.
- Throttled: line appears with multi-second delay.

### Mitigation

1. Validate FCM credentials: `google-services.json` matches the app's package name and is the expected Firebase project.
2. Check Play Services on the device (`com.google.android.gms`) is up to date and not force-stopped.
3. OEM aggressive battery management (Xiaomi, Huawei, Oppo) deprioritizes FCM for backgrounded apps. Whitelist the app in the OS battery settings during testing.
4. The foreground service (`VoipCallService`) is what keeps the app alive once the push lands; if the push never arrives, this is upstream of VoIP code. Open: no mitigation in the app for OEM throttling beyond surfacing it in user-facing docs.

---

## Foreground-service kill mid-call (Android)

### Symptom

Active VoIP call drops; system call UI disappears. User sees no error.

### Reproduction

1. Start a VoIP call on Android.
2. Open Settings → Apps → Rocket.Chat → Battery → Restrict / "App killed" path.
3. Or use `adb shell am kill chat.rocket.reactnative` while the call is active.

### Log signatures

- `chat.rocket.reactnative.voip.VoipCallService` last entry before kill, followed by silence.
- Logcat: `Scheduling restart of crashed service` (system_server) is the kernel-level signal.
- `RNCallKeep:endCall` event in JS if the OS forwards it; otherwise no JS log.

### Mitigation

Once the OS kills the service, the call is unrecoverable; the peer will see a hangup signal when DDP times out server-side. The app does not auto-reconnect mid-call.

1. Foreground service type `phoneCall` is required by Android 14+; verify it is set in `AndroidManifest.xml`.
2. Ensure the in-call notification is high-priority and not user-dismissable (system kills "low importance" foreground notifications more aggressively).

Open: graceful recovery (rebinding the call after service restart) is not implemented.

---

## Telecom permission revoke (Android)

### Symptom

Outgoing calls fail with no system UI; incoming calls do not ring. The PhoneAccount appears unregistered in Settings → Apps → Default apps → Calling accounts.

### Reproduction

1. Disable the calling account in Android settings (Settings → Apps → Default apps → Calling accounts → Rocket.Chat → off).
2. Or revoke via `adb shell pm revoke chat.rocket.reactnative android.permission.MANAGE_OWN_CALLS` (API 31+).
3. Attempt to place a call.

### Log signatures

- `chat.rocket.reactnative.voip.VoipNotification` `registerPhoneAccount` may throw `SecurityException` or silently no-op.
- Outgoing: no `IncomingCallActivity` launch, no `[VoIP]` newCall logs.

### Mitigation

The app re-registers the PhoneAccount on each FCM dispatch (idempotent if the user has not revoked). If permission is revoked:

1. Surface a one-time alert pointing at the calling-accounts settings screen.
2. The user must re-enable the account manually; the app cannot grant `MANAGE_OWN_CALLS` programmatically.

Open: pre-flight check before `startCall` to detect a revoked account and short-circuit with a useful message.

---

## Cross-workspace deep-link race

### Symptom

User receives a VoIP call for a workspace they are not currently logged into. The system call UI appears, but accepting bounces them through a workspace switch and the call may not reconnect.

### Reproduction

1. Log into workspace A.
2. From a second account on workspace B, place a VoIP call to a user account that is also a member of workspace A.
3. Accept the call on the lock screen.
4. Observe whether the app switches to workspace B and lands in CallView.

### Log signatures

- `[MediaCallEvents][iOS] VoipAcceptSucceeded:` then `Dispatched deepLinkingOpen for VoIP` (host mismatch path).
- `[MediaCallEvents][iOS] Same workspace as VoIP host` (no mismatch — short-circuit).
- `[MediaCallEvents][iOS] VoipAcceptFailed event:` (worse case: native accept failed entirely).

### Mitigation

The deep-linking saga performs the workspace switch and re-runs login, after which the new `MediaSessionInstance` replays REST signals and binds the call. Failure modes:

1. Login on workspace B requires credentials the user does not have on this device — call cannot resume.
2. The dedup sentinels (`lastHandledVoipAcceptFailureCallId`, `lastHandledVoipAcceptSucceededCallId`) prevent double-firing if both the warm and cold-start initial-events deliver the same payload.

See [Native Bridge Contract / Cross-workspace race](./ARCHITECTURE.md#cross-workspace-race).

---

## Permission-prompt re-evaluation race

### Symptom

User taps "call" on a DM. The microphone permission prompt appears. While they read it, an incoming call from another peer arrives and is auto-accepted on the lock screen. After the user grants the permission prompt, both calls appear (or the outgoing call replaces the incoming one).

### Reproduction

1. Fresh install (so the microphone permission has not been granted).
2. From this account, tap call on a DM.
3. While the OS prompt is showing, have a third account place a VoIP call to this device.
4. Accept the incoming call on the lock screen, then grant the microphone prompt.

### Log signatures

- `[VoIP] startCall blocked: ...` — none if the path proceeds past the first guard.
- After the prompt resolves, the post-permission re-evaluation throws `VoIP_Already_In_Call` and `roomId population` test "startCallByRoom clears optimistic roomId when post-permission guard rejects" applies.

### Mitigation

The post-permission re-check is the mitigation; it is covered by the [In-call guard re-evaluation invariant](./ARCHITECTURE.md#invariants). Verify:

1. `startCall` throws `VoIP_Already_In_Call` instead of placing the outgoing call.
2. `startCallByRoom` clears its optimistic `roomId`.

If the user reports both calls appearing simultaneously, this invariant has regressed.

---

## Mute echo

### Symptom

Audio cuts in and out, or the mute toggle button flips back and forth on its own. CPU usage may spike.

### Reproduction

1. Start a VoIP call on iOS.
2. Toggle mute from the in-app UI rapidly, or toggle mute from Control Center while the in-app UI is also responding to mute events.

### Log signatures

- Many consecutive `RNCallKeep:didPerformSetMutedCallAction` events with alternating `muted: true/false`.
- `[MediaCallEvents][iOS]` does not log per-toggle, but rapid Zustand state churn is visible in React DevTools / a custom store logger.

### Mitigation

The `if (muted !== isMuted) toggleMute()` guard in the `didPerformSetMutedCallAction` handler breaks the loop. Verify:

1. The handler is called with `muted` matching the new state, not echoing the previous one.
2. The active-UUID check is also passing (otherwise the event is dropped before reaching the mute compare).

See [Mute echo guard invariant](./ARCHITECTURE.md#invariants).

---

## Stale CallKit/Telecom session after server switch

### Symptom

User switches workspaces during or shortly after a call. The next CallKit/Telecom event (mute, hold, end) acts on the previous workspace's call object — usually visible as a phantom mute toggle, an unexpected hold, or a CallView that pops up showing data from the old call.

### Reproduction

1. Start a VoIP call on workspace A.
2. End the call (or do not).
3. Switch to workspace B and log in.
4. From a second account on workspace B, place a VoIP call.
5. Or: trigger a CallKit/Telecom mute/hold while the old call's UUID is still registered.

### Log signatures

- `RNCallKeep:didPerformSetMutedCallAction` or `didToggleHoldCallAction` with `callUUID` that does not match the current `useCallStore.callId`.
- The handler short-circuits on UUID mismatch (no further state change logged).

### Mitigation

`setupMediaCallEvents` lives on Root and survives logout/server switch by design (so initial events from a cold start are still delivered). The defensive UUID gate (`eventUuid !== activeUuid`) drops stale events before they touch state. Verify:

1. The lowercase comparison is intact (CallKit emits uppercase UUIDs on iOS, lowercase elsewhere).
2. `wasAutoHeld` is reset to false in the stale-mismatch branch of `didToggleHoldCallAction`.

See [Stale-session UUID gating invariant](./ARCHITECTURE.md#invariants) and [Auto-hold vs manual hold invariant](./ARCHITECTURE.md#invariants).
