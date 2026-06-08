# Pre-acquire the microphone permission at login, not at call time

**Status:** accepted

When an incoming VoIP call arrives while the device is locked or the app is backgrounded, the OS will not present a microphone permission dialog — so requesting it on the answer path is impossible exactly when we need it, and the call hangs until the ~10s signaling timeout. We therefore **request the microphone permission proactively at session init** (just after `MediaSessionInstance.init`, in `checkVoipPermission`, while the app is foreground), and make the incoming **answer path check-only**: it answers iff the permission is currently `granted`, otherwise it silently rejects the call (no prompt, no alert — the user may be on the lock screen).

This deliberately deviates from the platform-recommended "request permissions in context" pattern. The trade-off is a less contextual prompt at login in exchange for a working locked/backgrounded answer path. The prompt is not unbounded: it only runs for users whose workspace has the **voice-call entitlement** (the gate that makes VoIP init at all), fires at most once per OS decision, shows the denied alert only on a *fresh* denial (not on every relaunch), and is suppressed while a call is active/being reconciled. The outgoing path keeps an in-context request + alert as the recovery channel (foreground, routes to Settings when permanently denied).

## Considered options

- **Request on the answer path (status quo before this change)** — rejected: cannot prompt while locked/backgrounded, which is the case being fixed (NATIVE-1139 / deferred case #4).
- **Cache a granted/denied boolean at login and trust it at answer time** — rejected: a grant revoked in Settings between login and the call would be stale; the answer gate is a live `getPermissions` read instead.
