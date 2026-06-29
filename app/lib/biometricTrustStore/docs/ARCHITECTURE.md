# Biometric Trust Store Architecture

Load-bearing reference for the structure of the biometric trust store. Read this before `FLOWS.md` and `PLATFORMS.md` — those documents assume the vocabulary defined here.

## Overview

The biometric trust store is a single-runtime **TypeScript** subsystem layered on [`react-native-keychain`](https://github.com/oblador/react-native-keychain). It exists to answer one question at unlock time:

> _Is the device's biometric enrollment still the same one the user opted into?_

It answers this by storing a **sentinel** keychain item bound to the _current_ biometric enrollment set. When the enrollment changes (a face/fingerprint added or removed), the OS invalidates that item. The trust store reads the invalidation as a signal to drop biometric unlock and force passcode re-authentication.

The trust store is **not** the screen-lock feature itself. Screen lock (passcode, auto-lock timer, the lock modal) lives in [`../../methods/helpers/localAuthentication.ts`](../../methods/helpers/localAuthentication.ts) and [`../../../containers/Passcode/`](../../../containers/Passcode/). The trust store is the narrow component screen lock calls to decide whether biometric unlock is _trustworthy right now_.

---

## The sentinel

The security primitive is a single keychain entry, defined in [`../../constants/localAuthentication.ts`](../../constants/localAuthentication.ts):

| Constant                            | Value                |
| ----------------------------------- | -------------------- |
| `BIOMETRIC_TRUST_SENTINEL_SERVICE`  | `rc-biometric-trust` |
| `BIOMETRIC_TRUST_SENTINEL_USERNAME` | `biometric-trust`    |
| `BIOMETRIC_TRUST_SENTINEL_VALUE`    | `v1`                 |

It is written with two keychain options that together make it a tripwire (`index.ts`, `writeOptions`):

- `accessControl: BIOMETRY_CURRENT_SET` — binds the item to the **current** biometric enrollment. This is the crux: the OS tears the item down when the enrollment set changes. See `PLATFORMS.md` for how each OS does this.
- `accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` — never leaves the device, never restores from a backup to a different device.

Writing and probing the sentinel are **silent** (no biometric prompt). Only _reading the value back_ (`verify()`) presents the OS biometric sheet. This distinction drives the whole API design — see "Why writing the sentinel is not consent" below.

---

## The `TrustResult` union

Every trust operation returns a discriminated union ([`../../../definitions/IBiometricTrustStore.ts`](../../../definitions/IBiometricTrustStore.ts)):

```ts
type TrustResult =
	| { kind: 'success' } // sentinel read back, biometric matched
	| { kind: 'canceled' } // user dismissed the OS prompt
	| { kind: 'enrollmentChanged' } // enrollment changed -> item invalidated
	| { kind: 'unavailable' } // sentinel absent before any prompt
	| { kind: 'error'; cause: unknown };
```

`classifyError(e)` (`index.ts`) maps raw native errors onto these kinds:

| Raw signal                                                | Mapped kind               |
| --------------------------------------------------------- | ------------------------- |
| `errSecUserCancel` / `UserCancel` / `-128`                | `canceled`                |
| `KeyPermanentlyInvalidatedException` (Android)            | `enrollmentChanged`       |
| `errSecItemNotFound` / `-25300` (iOS, _after_ the prompt) | `enrollmentChanged`       |
| anything else                                             | `error` (carries `cause`) |

The `unavailable` kind is **not** produced by `classifyError`. It is returned by `verify()` when `hasEnrollment()` finds no sentinel _before_ any prompt is shown. This separation matters on iOS — see `PLATFORMS.md`.

---

## The store API (`IBiometricTrustStore`)

The `biometricTrustStore` singleton (`index.ts`) implements:

| Method                              | Prompts?        | Purpose                                                                                                                                                                           |
| ----------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enroll()`                          | no              | Write the sentinel (and, on Android, bind the native probe key — see below). On success also sets the migration marker (see below). Returns `TrustResult`.                       |
| `disenroll()`                       | no              | Delete the sentinel (and the Android probe key). Best-effort; swallows errors (item may already be gone).                                                                        |
| `verify({ promptCopy })`            | **yes**         | Probe the sentinel; if present, read it back behind the OS biometric sheet. Returns `TrustResult`.                                                                               |
| `hasEnrollment()`                   | no              | Silent existence check for the sentinel.                                                                                                                                          |
| `isEnrollmentValid()`               | no              | Silent check that the _current_ enrollment still matches what trust was bound to. iOS always returns `true` (the sentinel already covers changes); Android consults the native probe key. Returns `false` only on a detected Android enrollment change. See `PLATFORMS.md`. |
| `isEnabled()` / `setEnabled(b)`     | no              | Own the persisted `BIOMETRY_ENABLED_KEY` flag so callers never touch `UserPreferences` directly.                                                                                  |
| `isRelockPending()` / `setRelockPending(b)` | no      | Own the persisted relock marker (see "persisted state" below). Set when an enrollment change is detected at a point that cannot show the passcode itself (the init migration), so the next unlock is forced to demand it regardless of the auto-lock window. |
| `setBiometryEnabled(b)`             | yes if enabling | One-shot toggle: enroll+enable or disenroll+disable, keeping keychain state and the flag in sync. Returns the enroll `TrustResult` so the caller can roll back its UI on failure. |

### Pieces of persisted state

Three live in `UserPreferences` (keys in `constants/localAuthentication.ts`):

1. **`BIOMETRY_ENABLED_KEY`** (`kBiometryEnabled`) — "the user wants biometric unlock." Owned by `isEnabled`/`setEnabled`. Referred to throughout the docs as **the flag**.
2. **`BIOMETRIC_TRUST_MIGRATION_V1_DONE`** (`kBiometricTrustMigrationV1Done`) — "this install is trust-initialized." Referred to as **the migration marker** or **the marker**.
3. **`BIOMETRIC_PENDING_RELOCK_KEY`** (`kBiometricPendingRelock`) — "force the passcode on the next unlock." Owned by `isRelockPending`/`setRelockPending`. Referred to as **the relock marker**. Set by the init migration when it consumes an enrollment-change signal (or grandfathers an untrusted baseline) on cold launch — because the migration runs _before_ `localAuthenticate`, it would otherwise swallow the signal silently and the session would unlock inside the auto-lock window. `handleLocalAuthentication`/`localAuthenticate` read it (OR-ed with the live `hasBiometricEnrollmentChanged()` check) and clear it once the forced passcode modal is shown. See `FLOWS.md` §3–§4.

The sentinel (keychain) is a further piece of state. On Android there is also the native probe key (see below), kept in lockstep with the sentinel. The interplay between flag, marker, relock marker, and sentinel is the entire subtlety of this subsystem — see "Migration" below.

### The Android native enrollment probe

On iOS a `BIOMETRY_CURRENT_SET` keychain item is _deleted_ by the OS when the enrollment set changes, so `hasEnrollment()` alone detects a change silently. On Android the keystore key backing such an item is only _invalidated_, not deleted — the sentinel survives an enrollment change, and the invalidation surfaces only as a `KeyPermanentlyInvalidatedException` the first time the key is _used_ (which, via `react-native-keychain`'s combined read, would show the biometric prompt). So Android needs a separate detector.

`nativeEnrollmentProbe.ts` bridges a dedicated native module (`android/.../biometric/BiometricEnrollmentModule.kt`) that keeps a standalone AES keystore key (`setInvalidatedByBiometricEnrollment = true`) bound to the current enrollment:

- **`enrollProbe()`** — create the probe key bound to the current enrollment, in lockstep with `enroll()`. Best-effort; a failure just means the silent path is unavailable and the modal `verify()` backstop applies.
- **`disenrollProbe()`** — delete the probe key, in lockstep with `disenroll()`.
- **`isEnrollmentValid()`** — silent `cipher.init()` on the probe key: succeeds (no prompt) for a valid enrollment, throws `KeyPermanentlyInvalidatedException` once it changed. Returns `false` only on a detected change; a bridge/keystore failure resolves `true` so a transient error never forces the passcode on its own.

On iOS these helpers are no-ops that resolve `true` (the sentinel already covers enrollment changes). **Caveat:** `isEnrollmentValid()` lazily _creates_ the probe key as a fresh baseline when none exists, reporting `true` — there is no prior enrollment to differ from. So the probe cannot retroactively detect a change that happened _before_ the first baseline was ever bound; that gap is what the migration's grandfather relock closes (see "Migration").

### Why writing the sentinel is not consent

`enroll()` writes the sentinel silently — no biometric prompt — so it **cannot** double as proof the user agreed to biometric unlock. Callers that need real consent (the first-passcode opt-in in `checkBiometry`) must follow `enroll()` with a `verify()` prompt and tear the sentinel back down if the user declines. This is why `enroll` and the consent prompt are separate steps rather than one call. See `FLOWS.md` §2.

---

## Migration

`runBiometricTrustMigration` (`migration.ts`) is a one-shot upgrade path, run once at app init from the `restore` saga ([`../../../sagas/init.js`](../../../sagas/init.js)) **before** server/user restoration. It exists because users who enabled biometry _before_ the sentinel feature shipped have the flag set but no sentinel — there is nothing to detect enrollment changes against.

It is a pure function of three inputs: **flag** (`isEnabled()`), **sentinel** (`hasEnrollment()`), **marker** (the migration bool).

| flag  | sentinel |  marker   | Action                                            | Why                                                                  |
| :---: | :------: | :-------: | ------------------------------------------------- | -------------------------------------------------------------------- |
| false |    —     |     —     | no-op                                             | biometry not enabled; nothing to reconcile                           |
| true  | present  |     —     | no-op                                             | healthy: flag and sentinel agree                                     |
| true  |  absent  | **false** | `enroll()`, set marker, `setRelockPending(true)`  | **grandfather**: pre-feature user, bind a sentinel once and force a confirming passcode |
| true  |  absent  | **true**  | `setEnabled(false)`, `setRelockPending(true)`, no enroll | **reconciliation**: flag/sentinel desync, clear the flag and force the passcode |

If `enroll()` fails during the grandfather path, the marker and the relock marker are intentionally left unset so the next boot retries, and the flag is left as-is so the next unlock falls into `verify()`'s `unavailable` branch and asks for the passcode.

### Why the grandfather path forces a passcode

A pre-feature user has the flag set but no sentinel — and, on Android, no probe key. There is therefore **no prior baseline** to compare the current enrollment against, so the migration cannot tell the user's _original_ enrollment apart from one an attacker altered before this first upgrade (adding their own fingerprint/face on a stolen device). If the grandfather path merely bound a sentinel/probe silently and trusted it, the next biometric unlock would succeed with that attacker-inclusive enrollment — the exact bypass this subsystem exists to close. The Android native probe does **not** save us here: with no key yet, `isEnrollmentValid()` lazily creates a fresh baseline bound to the current (possibly attacker-inclusive) enrollment and reports `true`.

So the grandfather branch binds the baseline **and then sets the relock marker**, forcing the next unlock to demand the passcode regardless of the auto-lock window. Only the legitimate owner can pass it; from then on the baseline is trusted normally. This is a one-time cost on the first post-upgrade unlock for pre-feature biometry users.

### The invariant that makes the grandfather marker safe

> **Every successful `enroll()` sets the migration marker** (`index.ts`).

This is a security-critical line. Without it, an app-driven enroll (settings toggle or first-passcode opt-in) would leave `marker = false`. A later enrollment-change invalidation (flag set, sentinel gone) would then route to the **grandfather** row instead of **reconciliation** — re-binding the sentinel to the _new_ (attacker-inclusive) enrollment on the next launch, since writing the sentinel doesn't prompt. (The grandfather relock above contains the damage even then, but routing through reconciliation is the correct, fail-closed path.)

Because `enroll()` sets the marker, any post-feature user always has `marker = true`, so a missing sentinel routes to **reconciliation** (clear the flag, force the passcode). Only genuine pre-feature users (`marker = false`) ever take the one-time grandfather branch.

---

## `resolveBiometricTrust` — outcome mapping

`resolveBiometricTrust(result)` (`resolveBiometricTrust.ts`) is the policy layer: it maps a `verify()` `TrustResult` onto a `BiometricTrustOutcome` — whether the app unlocks, and the modal config to show next.

```ts
type BiometricTrustOutcome =
	| { unlocked: true }
	| { unlocked: false; modal: { hasBiometry: boolean; reason?: 'enrollmentChanged' } };
```

| `verify()` kind      | Side effects                        | Outcome                                                                            |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `success`            | —                                   | `{ unlocked: true }`                                                               |
| `enrollmentChanged`  | `disenroll()` → `setEnabled(false)` | locked; modal hides biometry, shows the enrollment-changed subtitle                |
| `unavailable`        | `disenroll()` → `setEnabled(false)` | locked; modal hides biometry, **no** subtitle (can be benign — see `PLATFORMS.md`) |
| `canceled` / `error` | none                                | locked; modal **keeps** the biometry button so the user can retry                  |

### The disenroll-before-clear ordering invariant

> On any invalidation, `disenroll()` **must** run before `setEnabled(false)`.

If a crash happens between the two, the surviving state is _flag set, sentinel gone_ — which the migration's **reconciliation** row cleans up on the next launch. The reverse order would leave _flag cleared, sentinel live_, which looks like a healthy disabled state and orphans the sentinel forever (no path ever reconciles it).

---

## Invariants summary

1. **Writing/probing the sentinel never prompts; only `verify()` does.** Consent requires a `verify()`, not an `enroll()`.
2. **Every successful `enroll()` sets the migration marker.** Keeps app-driven enrolls out of the grandfather branch.
3. **On invalidation, `disenroll()` precedes `setEnabled(false)`.** Keeps a crash recoverable by reconciliation.
4. **Flag and sentinel are kept in lockstep.** `setBiometryEnabled`, `checkBiometry`, and `resolveBiometricTrust` never leave one set without the other (the migration is the safety net for crashes that break this). On Android the native probe key is bound/torn down in lockstep with the sentinel inside `enroll()`/`disenroll()`.
5. **The sentinel is `THIS_DEVICE_ONLY`.** It never restores across devices, so a restored backup correctly reads as `unavailable`.
6. **A baseline bound without a prior baseline is never trusted silently.** When the migration consumes an enrollment-change signal (reconciliation) or binds a first baseline for a pre-feature user (grandfather) on cold launch, it sets the **relock marker** so the next unlock forces the passcode regardless of the auto-lock window — the migration runs before `localAuthenticate` and would otherwise swallow the signal.
