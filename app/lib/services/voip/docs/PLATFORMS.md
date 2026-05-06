# Platforms

iOS- and Android-specific quirks. The shared model (call lifecycle, store shape, VoIP-vs-VideoConf separation) lives in `ARCHITECTURE.md`; this file does not duplicate it.

## iOS

### PushKit and APNS

VoIP pushes use **PushKit**, separate from APNS. The cert is distinct: an APNS cert delivers regular notifications, a VoIP-Services cert delivers PushKit pushes. Misconfiguring this is a common cause of "incoming calls never arrive". The Apple Developer Portal app id must have **Push Notifications** and **Voice over IP** capabilities enabled.

The registration path:

1. `VoipService.voipRegistration()` runs on app launch and creates a `PKPushRegistry`.
2. `AppDelegate+Voip.swift` receives `didUpdatePushCredentials`. The token is hex-encoded and persisted (MMKV).
3. The `VoipPushTokenRegistered` event is emitted to JS, which calls `registerPushToken()` against the server.

Push payloads must be delivered with the `apns-push-type: voip` header.

### CallKit reporting deadline

When a PushKit payload arrives, iOS gives the app a hard window (~5 seconds) to call `CXProvider.reportNewIncomingCall`. Missing the deadline kills the app and trips a strike against the bundle id; a few strikes and PushKit is disabled for the app. `VoipService` reports the call **before** any DDP work, then opens the per-call DDP client.

### Native accept path — no JS `answerCall` listener

There is intentionally no `RNCallKeep` `answerCall` listener in `MediaCallEvents.ts` on iOS. Acceptance is detected via `CXCallObserver`:

- `IncomingCallObserver` (a `CXCallObserverDelegate` registered in `VoipService`) fires `callObserver(_:callChanged:)`.
- `handleObservedCallChanged` checks `call.hasConnected == true`.
- `handleNativeAccept(callId)` runs once per `callId` (deduplication via `nativeAcceptHandledCallIds`) and sends the REST `media-calls.answer` over the **per-call DDP client** while JS may still be booting.
- On success, native emits `VoipAcceptSucceeded`; on failure, `VoipAcceptFailed`.

`CXCallObserver` is on `.main`, registered once (`isCallObserverConfigured`).

### Per-call DDP — `VoipPerCallDdpRegistry.swift`

A short-lived DDP client per incoming call so the REST accept lands before the main app DDP socket is up. The registry is keyed by `callId`. On exit (accept resolved, call ended, timeout), the client clears queued method calls and disconnects.

### `Info.plist` keys and capabilities

- `UIBackgroundModes` must include `voip`.
- `NSMicrophoneUsageDescription` is required (CallKit will fail silently otherwise on first install).
- The bundle id needs **Push Notifications** and **Voice over IP** entitlements in the provisioning profile.

## Android

### Self-managed PhoneAccount

The app registers a self-managed `PhoneAccount` via `TelecomManager.registerPhoneAccount` in `VoipNotification.kt`, with `PhoneAccount.CAPABILITY_SELF_MANAGED`. Registration is idempotent for the same handle. The account is required so Telecom will route incoming-call UI to the app instead of the dialer; without it, FCM pushes can arrive but the app cannot present a system call UI.

### Audio-routing constraint (do not bypass)

Self-managed PhoneAccount disables `Connection.setAudioRoute` and `onCallAudioStateChanged` never fires. The app drives `AudioManager` directly via `setCommunicationDevice` plus `OnCommunicationDeviceChangedListener` on API 31+, with a `setSpeakerphoneOn` legacy fallback below 31. **Do not try to route audio through CallKeep — it will silently no-op.** This applies to the in-call audio path; the dialtone uses `STREAM_VOICE_CALL` which routes to loudspeaker by default and is unaffected by `setCommunicationDevice`.

### FCM dispatch path

VoIP incoming calls arrive as FCM **data-only payloads** (so the app can wake without showing a default notification). Dispatch:

1. `RCFirebaseMessagingService.onMessageReceived` parses the data payload. If `VoipPayload.isVoipIncomingCall` is true, routing goes to `VoipIncomingCallDispatch`.
2. `VoipIncomingCallDispatch` ensures the self-managed PhoneAccount is registered, opens a per-call DDP client, and starts `VoipCallService` as a foreground service.
3. `VoipCallService` shows the foreground notification, drives the call lifecycle, and on user accept sends the REST `media-calls.answer` over the per-call DDP client. Result is forwarded as `VoipAcceptSucceeded` / `VoipAcceptFailed` once JS is alive.

`IncomingCallActivity` is the lock-screen activity that surfaces the incoming call UI when the device is locked.

### Per-call DDP — `VoipPerCallDdpRegistry.kt`

Mirrors the iOS rationale: a short-lived DDP client per incoming call so the REST accept and any inbound signaling can land before the app's main DDP socket exists. The registry is keyed by `callId`; clients close on accept-resolved, call-ended, or timeout.

### Foreground service types

- `VoipCallService` — `android:foregroundServiceType="phoneCall"`. Required by Android 14+ for self-managed Telecom calls.
- A second service (declared with `microphone|phoneCall`) covers the microphone-active state during the call.

### `AndroidManifest.xml` permissions

- `RECORD_AUDIO`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_MICROPHONE`
- `FOREGROUND_SERVICE_PHONE_CALL`
- `MANAGE_OWN_CALLS`
- `BIND_TELECOM_CONNECTION_SERVICE`

`react-native-callkeep` ships extra permissions (e.g. dialer, phone-number access) that are stripped because the app uses self-managed Telecom and does not need them.
