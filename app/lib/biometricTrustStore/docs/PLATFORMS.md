# Platforms

iOS- and Android-specific behaviour of the biometric trust store. The shared model (sentinel, `TrustResult` kinds, migration, invariants) lives in `ARCHITECTURE.md`; this file does not duplicate it.

Both platforms share the same intent: an entry stored under `accessControl: BIOMETRY_CURRENT_SET` is invalidated by the OS when the biometric enrolment set changes. They differ in _how_ that invalidation surfaces, and the difference is load-bearing for the `unavailable`-vs-`enrollmentChanged` split in `verify()`.

## iOS

### How an enrolment change surfaces

On iOS, changing the Face ID / Touch ID enrolment **deletes** the keychain item bound to `BIOMETRY_CURRENT_SET`. The item is gone, not merely locked. This produces two distinct observations depending on _when_ the store looks:

1. **Before any prompt** — `verify()` calls `hasEnrolment()` first (`hasGenericPassword`, silent). The item is already gone, so this returns false and `verify()` returns **`unavailable`** — no biometric sheet is ever shown.
2. **After a prompt** — if the item still appeared to exist and the read (`getGenericPassword`) raised `errSecItemNotFound` (`-25300`), `classifyError` maps it to **`enrollmentChanged`**.

In practice on iOS the enrolment-change case usually lands as **`unavailable`** via path 1, because the deletion is observed by the silent existence check before the read path runs. `resolveBiometricTrust` treats both the same way at the security level — disenrol, clear the flag, hide the biometry button — but `unavailable` shows **no** "enrollment changed" subtitle, because it is not necessarily an enrolment change (see below).

### Why `unavailable` has no subtitle

A missing sentinel on iOS is not _always_ an attack signal. The sentinel is `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so it legitimately does not exist after:

- restoring an app backup onto a new device (the item never transfers), or
- any other benign loss of the keychain item.

So `unavailable` clears biometric unlock defensively (fail closed — require the passcode) but does **not** accuse the user of an enrolment change. Only the explicit `enrollmentChanged` kind shows the subtitle copy.

### Prompt-behind-modal requirement

The OS biometric sheet must never appear with app content visible behind it, or screen lock is defeated for the duration of the sheet. iOS makes this easy to get wrong because the sheet can be triggered from anywhere. The contract: `handleLocalAuthentication` opens the passcode modal first, and `PasscodeEnter` is the only place that calls `verify()` (auto on mount and via the retry button). There is intentionally **no** upstream biometric preflight. See `FLOWS.md` §3.

## Android

### How an enrolment change surfaces

On Android the keystore key backing the item is **invalidated but not deleted**. Reading it raises `KeyPermanentlyInvalidatedException`, which `classifyError` maps to **`enrollmentChanged`**. So Android typically reaches the explicit `enrollmentChanged` kind (and its subtitle), where iOS more often reaches `unavailable`.

This is the key asymmetry to keep in mind when reading or testing the flow: **the same user action (adding a fingerprint) can produce `unavailable` on iOS and `enrollmentChanged` on Android.** The security response is identical; only the subtitle differs. Tests must not assume one kind across both platforms.

### Cancel signal

A dismissed prompt surfaces as an `AuthenticationCanceled`/`UserCancel`-style error, mapped to `canceled` — the biometry button is kept for manual retry, matching iOS's `errSecUserCancel` / `-128`.

## Quick comparison

|                                                 | iOS                                           | Android                                     |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| Enrolment change on the item                    | item **deleted**                              | key **invalidated**, not deleted            |
| Usual `verify()` kind after a change            | `unavailable` (silent existence check)        | `enrollmentChanged` (read raises exception) |
| Native signal classified to `enrollmentChanged` | `errSecItemNotFound` / `-25300` (post-prompt) | `KeyPermanentlyInvalidatedException`        |
| Cancel signal                                   | `errSecUserCancel` / `-128`                   | `AuthenticationCanceled` / `UserCancel`     |
| Sentinel survives device migration?             | no (`THIS_DEVICE_ONLY`)                       | no (`THIS_DEVICE_ONLY`)                     |

In all cases the user-facing result is the same fail-closed behaviour: biometric unlock is dropped and the passcode is required.
