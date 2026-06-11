# Suppress incoming VoIP locally at the push layer when the microphone is denied

**Status:** accepted

When the OS **Microphone permission** is denied, an incoming call can never carry audio _on this device_ — answering it only yields a dead call. But the same user may have the call ringing elsewhere (desktop, another phone). Any signal this device sends to the server — `reject` included — ends the call for the whole user, robbing the other devices of the chance to answer.

Two earlier iterations were discarded:

- **Answer gate only (JS, answer time)** — the device still rang for a call that was never answerable, and answer-time JS may not be alive on a locked/backgrounded device.
- **Reject-without-ringing (native, push receipt)** — no ring, but the REST `reject` ended the call everywhere; a phone with a denied mic silently prevented the user from answering on an authorized device.

The decision: the native push handler **suppresses the call locally and signals nothing** (**Suppress-without-ringing**), exactly like the existing stale/expired-push handling. Other devices keep ringing; the caller is unaffected. The behaviour is as invisible as each platform allows:

- **Android** — truly silent. `decideIncomingVoipPushAction` routes to `IGNORE_NO_PERMISSION` (precedence `stale → no-permission → busy → show`): no Telecom registration, no notification, no REST call.
- **iOS** — PushKit hard-requires reporting the call to CallKit before the push handler returns, or the OS terminates the app and stops delivering VoIP pushes. The floor is the placeholder-report-then-immediately-end already used for expired/unparseable payloads (a sub-second CallKit flash), with no REST call and nothing stashed for JavaScript.

The JS **Answer gate** backstop still _ends_ the call when the permission disappears between push receipt and answer: by then native has already sent the REST accept, the server has stopped ringing the other devices, and the call cannot be handed back to them — ending it is the only coherent outcome.

## Considered options

- **Keep the push-layer REST `reject` (previous iteration of this ADR)** — rejected: a reject from one device ends the call for every device of the user.
- **Truly silent suppression on iOS** — rejected: impossible under PushKit. Returning from the push handler without reporting to CallKit makes the OS kill the app and stop delivering VoIP pushes. The momentary CallKit flash is the accepted floor, not a shortcut.
- **Unregister the VoIP push token while the mic is denied** — rejected: the permission can change in OS Settings while the app is killed, and the app only learns at next launch. A stale unregistration silently loses _all_ incoming calls until the app is reopened — strictly worse than a flash.
