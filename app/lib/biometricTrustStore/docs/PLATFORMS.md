# Platforms

iOS- and Android-specific behaviour of the biometric trust store. The shared model (sentinel, `TrustResult` kinds, migration, invariants) lives in `ARCHITECTURE.md`; this file does not duplicate it.

Both platforms share the same intent: an entry stored under `accessControl: BIOMETRY_CURRENT_SET` is invalidated by the OS when the biometric enrollment set changes. They differ in _how_ that invalidation surfaces, and the difference is load-bearing for the `unavailable`-vs-`enrollmentChanged` split in `verify()`.

## iOS

### How an enrollment change surfaces

On iOS, changing the Face ID / Touch ID enrollment **deletes** the keychain item bound to `BIOMETRY_CURRENT_SET`. The item is gone, not merely locked. This produces two distinct observations depending on _when_ the store looks:

1. **Before any prompt** — `verify()` calls `hasEnrollment()` first (`hasGenericPassword`, silent). The item is already gone, so this returns false and `verify()` returns **`unavailable`** — no biometric sheet is ever shown.
2. **After a prompt** — if the item still appeared to exist and the read (`getGenericPassword`) raised `errSecItemNotFound` (`-25300`), `classifyError` maps it to **`enrollmentChanged`**.

In practice on iOS the enrollment-change case usually lands as **`unavailable`** via path 1, because the deletion is observed by the silent existence check before the read path runs. `resolveBiometricTrust` treats both the same way at the security level — disenroll, clear the flag, hide the biometry button — but `unavailable` shows **no** "enrollment changed" subtitle, because it is not necessarily an enrollment change (see below).

### Why `unavailable` has no subtitle

A missing sentinel on iOS is not _always_ an attack signal. The sentinel is `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so it legitimately does not exist after:

- restoring an app backup onto a new device (the item never transfers), or
- any other benign loss of the keychain item.

So `unavailable` clears biometric unlock defensively (fail closed — require the passcode) but does **not** accuse the user of an enrollment change. Only the explicit `enrollmentChanged` kind shows the subtitle copy.

### Prompt-behind-modal requirement

The OS biometric sheet must never appear with app content visible behind it, or screen lock is defeated for the duration of the sheet. iOS makes this easy to get wrong because the sheet can be triggered from anywhere. The contract: `handleLocalAuthentication` opens the passcode modal first, and `PasscodeEnter` is the only place that calls `verify()` (auto on mount and via the retry button). There is intentionally **no** upstream biometric preflight. See `FLOWS.md` §3.

## Android

### How an enrollment change surfaces

On Android the keystore key backing the item is **invalidated but not deleted**. Reading it raises `KeyPermanentlyInvalidatedException`, which `classifyError` maps to **`enrollmentChanged`**. So Android typically reaches the explicit `enrollmentChanged` kind (and its subtitle), where iOS more often reaches `unavailable`.

This is the key asymmetry to keep in mind when reading or testing the flow: **the same user action (adding a fingerprint) can produce `unavailable` on iOS and `enrollmentChanged` on Android.** The security response is identical; only the subtitle differs. Tests must not assume one kind across both platforms.

### The silent enrollment probe key

Because the Android sentinel **survives** an enrollment change (the key is invalidated, not deleted), the JS layer's silent `hasEnrollment()` existence check can't see the change — and the only `react-native-keychain` read that would surface the `KeyPermanentlyInvalidatedException` also shows the OS biometric prompt, so it can't be used as a silent at-rest probe (it would defeat the prompt-behind-modal contract below). Android therefore carries a **dedicated probe key**, implemented natively in `android/app/src/main/java/chat/rocket/reactnative/biometric/BiometricEnrollmentModule.kt` and bridged by `nativeEnrollmentProbe.ts`:

- It is a standalone AES/GCM keystore key (`setUserAuthenticationRequired = true`, `setInvalidatedByBiometricEnrollment = true`) under alias `rc_biometric_enrollment_probe` — separate from the sentinel, used only for detection, never for crypto.
- **`enrollProbe()` / `disenrollProbe()`** create and delete the key in lockstep with the sentinel, called from the store's `enroll()` / `disenroll()`.
- **`isEnrollmentValid()`** runs `Cipher.init(ENCRYPT_MODE, key)` on it. `init()` does **not** prompt and does **not** run crypto (auth is only enforced at `doFinal`, which is never called); it simply throws `KeyPermanentlyInvalidatedException` once the enrollment has changed. So it is a fully silent at-rest check — the missing counterpart to iOS's free `hasEnrollment()` signal. `handleLocalAuthentication`/`localAuthenticate` call it (via `biometricTrustStore.isEnrollmentValid()`) to force the passcode even inside the auto-lock window.
- **Lazy baseline.** If no probe key exists when `isEnrollmentValid()` is called (fresh install/upgrade, or just disenrolled), it creates one bound to the current enrollment and reports `valid` — there is no prior enrollment to differ from. This is why a pre-feature user's first upgrade cannot be retroactively validated by the probe, and why the migration's grandfather branch forces a confirming passcode instead (see `ARCHITECTURE.md`, "Why the grandfather path forces a passcode").
- **Failure mode.** Fail-open is deliberately narrow, because on a warm auto-lock unlock this probe is the *sole* gate — `verify()` never runs there. It resolves `true` **only** when the keystore provider itself is unavailable (`KeyStore.getInstance`/`load`/`containsAlias` throw) — an environmental error that says nothing about the key's validity. Once the keystore is readable and the probe alias exists, the **only** path to `true` is a clean `getKey()` + `Cipher.init()`; **any** failure in that region resolves `false` (fail closed). This matters because a changed/invalidated enrollment does **not** always surface as `KeyPermanentlyInvalidatedException` at `init()` — across OEMs / API levels / StrongBox it can appear as `UnrecoverableKeyException` or a generic `KeyStoreException` at `getKey()`, or another `InvalidKeyException` at `init()`; treating only KPIE as a change would let those slip through fail-open. The JS bridge (`nativeEnrollmentProbe.ts`) likewise fails **closed** for `isEnrollmentValid` — the native module never rejects, so a rejection means a broken bridge on a device where the module should exist, which forces the passcode rather than silently reporting valid. Creating a baseline when biometrics were removed entirely fails, which is treated as a change (`false`) so the passcode is required.

On **iOS** there is no native counterpart: `enrollProbe`/`disenrollProbe` are no-ops and `isEnrollmentValid()` resolves `true`, because the sentinel deletion already covers enrollment changes for free.

### Cancel signal

A dismissed prompt surfaces as an `AuthenticationCanceled`/`UserCancel`-style error, mapped to `canceled` — the biometry button is kept for manual retry, matching iOS's `errSecUserCancel` / `-128`.

## Quick comparison

|                                                 | iOS                                           | Android                                                |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Enrollment change on the item                   | item **deleted**                              | key **invalidated**, not deleted                       |
| Usual `verify()` kind after a change            | `unavailable` (silent existence check)        | `enrollmentChanged` (read raises exception)            |
| Native signal classified to `enrollmentChanged` | `errSecItemNotFound` / `-25300` (post-prompt) | `KeyPermanentlyInvalidatedException`                   |
| Cancel signal                                   | `errSecUserCancel` / `-128`                   | `AuthenticationCanceled` / `UserCancel`                |
| Silent at-rest enrollment check                 | `hasEnrollment()` (item deleted on change)    | native probe key `isEnrollmentValid()` (`cipher.init`) |
| Sentinel survives device migration?             | no (`THIS_DEVICE_ONLY`)                       | no (`THIS_DEVICE_ONLY`)                                |

In all cases the user-facing result is the same fail-closed behaviour: biometric unlock is dropped and the passcode is required.
