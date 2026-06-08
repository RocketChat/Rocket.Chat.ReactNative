# Reject incoming VoIP at the native push layer when the microphone is denied

**Status:** accepted

When the OS **Microphone permission** is denied, an incoming call can never carry audio — answering it only yields a dead call. The earlier iteration gated this in JavaScript at answer time (the **Answer gate**): the device still rang, and only when the user accepted did the app silently end the call. That still rings for a call that was never answerable, and on a locked/backgrounded device JS may not even be alive in time.

The ring originates in the native push handlers (Android FCM → Telecom/notification; iOS PushKit → CallKit), not in JavaScript. We therefore make the **Incoming-push gate** the primary defence: read the microphone grant natively at push receipt and, when denied, **Reject-without-ringing** before any ringing UI is presented. The JS **Answer gate** is demoted to a defence-in-depth backstop for the narrow window where the permission is revoked between push receipt and answer (see `adr/0001-pre-acquire-microphone-at-login.md`).

The behaviour is as symmetric as each platform allows:

- **Android** — truly silent. The push is declined via REST `reject` with no Telecom registration and no notification; nothing is ever shown or heard. The routing decision (`decideIncomingVoipPushAction`) gains a `REJECT_NO_PERMISSION` outcome whose precedence is `stale → no-permission → busy → show`.
- **iOS** — PushKit hard-requires reporting the call to CallKit before the push handler returns, or the OS terminates the app and stops delivering VoIP pushes. The closest possible behaviour is to report a placeholder call and end it immediately (a sub-second CallKit flash), then REST `reject`, without stashing the event for JavaScript. This mirrors the existing expired/unparseable-payload handling.

## Considered options

- **Keep the JavaScript answer-time gate as the only gate (previous iteration)** — rejected: the device still rings for a call that can never be answered, and answer-time JS is unreliable on a locked/backgrounded device.
- **Truly silent rejection on iOS** — rejected: impossible under PushKit. Returning from the push handler without reporting to CallKit makes the OS kill the app and stop delivering VoIP pushes. The momentary CallKit flash is the accepted floor, not a shortcut.
