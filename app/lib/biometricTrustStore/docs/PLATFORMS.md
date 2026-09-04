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
- **No lazy baseline.** `isEnrollmentValid()` never creates a key. If no probe key exists when it is called (fresh install/upgrade, or just disenrolled), it logs and resolves `false` — treat as changed — rather than self-healing to whatever is currently enrolled. Key creation happens only in `enrollProbe()`, in lockstep with the sentinel. A pre-feature user's first upgrade therefore cannot be validated by the probe; the migration's grandfather branch forces a confirming passcode instead (see `ARCHITECTURE.md`, "Why the grandfather path forces a passcode").
- **Failure mode.** Fail-open is deliberately narrow, because on a warm auto-lock unlock this probe is the _sole_ gate — `verify()` never runs there. It resolves `true` **only** when the keystore provider itself is unavailable (`KeyStore.getInstance`/`load(null)` throw) — an environmental error that says nothing about the key's validity. Once the provider is instantiated, the **only** path to `true` is a clean `containsAlias()` + `getKey()` + `Cipher.init()`; **any** failure in that region resolves `false` (fail closed) — including a `KeyStoreException` from `containsAlias()` on a readable-but-corrupted keystore, which forces the passcode and tears biometry down via `invalidate()`, recoverable by re-enabling. This matters because a changed/invalidated enrollment does **not** always surface as `KeyPermanentlyInvalidatedException` at `init()` — across OEMs / API levels / StrongBox it can appear as `UnrecoverableKeyException` or a generic `KeyStoreException` at `getKey()`, or another `InvalidKeyException` at `init()`; treating only KPIE as a change would let those slip through fail-open. The JS bridge (`nativeEnrollmentProbe.ts`) likewise fails **closed** for `isEnrollmentValid` — the native module never rejects, so a rejection means a broken bridge on a device where the module should exist, which forces the passcode rather than silently reporting valid. Creating a baseline when biometrics were removed entirely fails, which is treated as a change (`false`) so the passcode is required.

On **iOS** there is no native counterpart: `enrollProbe`/`disenrollProbe` are no-ops and `isEnrollmentValid()` resolves `true`, because the sentinel deletion already covers enrollment changes for free.

### Weak (Class 2) biometrics

The keystore only binds a user-auth key to a **strong (Class 3)** biometric, so a device whose only enrollment is Class 2 (much mid-range Android face unlock) can hold no real sentinel. Three places have to know this, because none of them fails loudly on its own:

- **`hasSupportedBiometry()`** (`localAuthentication.ts`) requires `getEnrolledLevelAsync() === BIOMETRIC_STRONG`. `isEnrolledAsync()` alone is a `BIOMETRIC_WEAK` query — it resolves `true` on a Class 2 device, which would offer an opt-in that has to be revoked moments later. `enableBiometry` gates on this before writing anything. (iOS reports any biometry as `BIOMETRIC_STRONG`; the Swift module hardcodes `case biometric = 3`, so this is an Android-only narrowing.)
- **`biometryAuth()`** (`localAuthentication.ts`) passes `biometricsSecurityLevel: 'strong'` to `authenticateAsync`. Expo defaults that option to `'weak'`, and with `disableDeviceFallback: true` the allowed set is exactly what it maps to — so the default prompt accepts a Class 2 enrollment. Neither trust artifact can see one (`setInvalidatedByBiometricEnrollment` only fires on Class 3 changes, and the sentinel key is `BIOMETRIC_STRONG`/`DEVICE_CREDENTIAL`-bound), so on Android — where `biometryAuth` never calls `verify()` — a newly enrolled Class 2 face would otherwise unlock the app, and could even give the opt-in consent at `enableBiometry`. Side effect: on a device whose strong enrollment was removed, `authenticateAsync` errors instead of prompting, which `classifyPresenceError` maps to `unavailable`.
- **`enroll()`** (`index.ts`) rejects a sentinel that landed in a non-authenticated cipher storage. Asking for `BIOMETRY_CURRENT_SET` does **not** guarantee one: `getCipherStorageForCurrentAPILevel` ANDs the requested access control with `isStrongBiometricAuthAvailable`, and on a Class 2 device skips every auth-backed storage and falls back to a plain one. The write then _succeeds_ — leaving a sentinel with no user-auth requirement and no enrollment binding, which `hasEnrollment()` would happily report as trust. `enroll()` therefore checks the returned `storage` against `KeystoreAESGCM`/`KeystoreRSAECB`, tears the entry down, and returns `unavailable` before the migration marker is set.

### Why the sentinel read can't prove presence

On iOS a successful `verify()` proves two things at once: the enrollment is unchanged **and** a live user just authenticated. On Android it only proves the first, so `biometryAuth` (in `localAuthentication.ts`) does **not** use `verify()` there.

`react-native-keychain` builds the sentinel's keystore key with a 5-second auth window that accepts device credentials, not only biometrics (`CipherStorageKeystoreAesGcm.getKeyGenSpecBuilder`):

```kotlin
setUserAuthenticationParameters(5, KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL)
```

and `CipherStorageKeystoreAesGcm.decrypt()` tries the cipher first, reaching the `BiometricPrompt` **only** from its `UserNotAuthenticatedException` catch branch. Inside the window no exception is raised, so the decrypt simply succeeds and the prompt is never shown. Concretely: unlock the phone with the **PIN**, open the app within 5s, and a bare `verify()` returns `success` with nothing on screen. (The prompt is also handed to `BiometricPrompt.authenticate(promptInfo)` without a `CryptoObject`, so even when it does appear it authorizes nothing cryptographically.)

Android therefore splits the two concerns, keeping the total at one OS prompt:

| Concern              | Android mechanism                                                        |
| -------------------- | ------------------------------------------------------------------------ |
| Enrollment unchanged | `isEnrollmentValid()` — the silent probe key above                       |
| Live user present    | `LocalAuthentication.authenticateAsync({ disableDeviceFallback: true })` |

This costs nothing on the detection side: `KeyPermanentlyInvalidatedException` is raised at key extraction regardless of the auth window, so the enrollment signal was never dependent on the prompt firing. It also means the Android sentinel's only remaining job is "is trust initialized" (`hasEnrollment()`, a silent existence check) — the probe key carries the enrollment binding and `authenticateAsync` carries presence.

The same reasoning applies to the consent prompt: `enableBiometry` captures consent through `biometryAuth(true)` rather than `verify()`, because a prompt that never appeared is not consent.

### Cancel signal

On iOS a dismissed prompt surfaces as an `errSecUserCancel` / `-128` error from the keychain read, mapped to `canceled`. On Android it comes back as an `expo-local-authentication` result with `success: false` and `error: 'user_cancel'` (or `app_cancel` / `system_cancel` / `user_fallback` / `authentication_failed`), mapped to `canceled` by `classifyPresenceError`. Either way the biometry button is kept for manual retry. `not_enrolled` / `not_available` map to `unavailable` (fail closed, tear trust down); anything else is a real `error`.

## Quick comparison

|                                                 | iOS                                           | Android                                                |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Enrollment change on the item                   | item **deleted**                              | key **invalidated**, not deleted                       |
| Usual `verify()` kind after a change            | `unavailable` (silent existence check)        | `enrollmentChanged` (read raises exception)            |
| Native signal classified to `enrollmentChanged` | `errSecItemNotFound` / `-25300` (post-prompt) | `KeyPermanentlyInvalidatedException`                   |
| Cancel signal                                   | `errSecUserCancel` / `-128`                   | expo `error: 'user_cancel'` (and friends)              |
| Silent at-rest enrollment check                 | `hasEnrollment()` (item deleted on change)    | native probe key `isEnrollmentValid()` (`cipher.init`) |
| What proves a live user (`biometryAuth`)        | `verify()` — the sentinel read itself         | `authenticateAsync` (no fallback, `'strong'` only)     |
| Sentinel survives device migration?             | no (`THIS_DEVICE_ONLY`)                       | no (`THIS_DEVICE_ONLY`)                                |

In all cases the user-facing result is the same fail-closed behaviour: biometric unlock is dropped and the passcode is required.
