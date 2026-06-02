# Biometric Trust Store Architecture

Load-bearing reference for the structure of the biometric trust store. Read this before `FLOWS.md` and `PLATFORMS.md` — those documents assume the vocabulary defined here.

## Overview

The biometric trust store is a single-runtime **TypeScript** subsystem layered on [`react-native-keychain`](https://github.com/oblador/react-native-keychain). It exists to answer one question at unlock time:

> _Is the device's biometric enrolment still the same one the user opted into?_

It answers this by storing a **sentinel** keychain item bound to the _current_ biometric enrolment set. When the enrolment changes (a face/fingerprint added or removed), the OS invalidates that item. The trust store reads the invalidation as a signal to drop biometric unlock and force passcode re-authentication.

The trust store is **not** the screen-lock feature itself. Screen lock (passcode, auto-lock timer, the lock modal) lives in [`../../methods/helpers/localAuthentication.ts`](../../methods/helpers/localAuthentication.ts) and [`../../../containers/Passcode/`](../../../containers/Passcode/). The trust store is the narrow component screen lock calls to decide whether biometric unlock is _trustworthy right now_.

---

## The sentinel

The security primitive is a single keychain entry, defined in [`../../constants/localAuthentication.ts`](../../constants/localAuthentication.ts):

| Constant                            | Value                                     |
| ----------------------------------- | ----------------------------------------- |
| `BIOMETRIC_TRUST_SENTINEL_SERVICE`  | `chat.rocket.reactnative.biometric-trust` |
| `BIOMETRIC_TRUST_SENTINEL_USERNAME` | `biometric-trust`                         |
| `BIOMETRIC_TRUST_SENTINEL_VALUE`    | `v1`                                      |

It is written with two keychain options that together make it a tripwire (`index.ts`, `writeOptions`):

- `accessControl: BIOMETRY_CURRENT_SET` — binds the item to the **current** biometric enrolment. This is the crux: the OS tears the item down when the enrolment set changes. See `PLATFORMS.md` for how each OS does this.
- `accessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` — never leaves the device, never restores from a backup to a different device.

Writing and probing the sentinel are **silent** (no biometric prompt). Only _reading the value back_ (`verify()`) presents the OS biometric sheet. This distinction drives the whole API design — see "Why writing the sentinel is not consent" below.

---

## The `TrustResult` union

Every trust operation returns a discriminated union ([`../../../definitions/IBiometricTrustStore.ts`](../../../definitions/IBiometricTrustStore.ts)):

```ts
type TrustResult =
	| { kind: 'success' } // sentinel read back, biometric matched
	| { kind: 'canceled' } // user dismissed the OS prompt
	| { kind: 'enrollmentChanged' } // enrolment changed -> item invalidated
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

The `unavailable` kind is **not** produced by `classifyError`. It is returned by `verify()` when `hasEnrolment()` finds no sentinel _before_ any prompt is shown. This separation matters on iOS — see `PLATFORMS.md`.

---

## The store API (`IBiometricTrustStore`)

The `biometricTrustStore` singleton (`index.ts`) implements:

| Method                          | Prompts?        | Purpose                                                                                                                                                                        |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enrol()`                       | no              | Write the sentinel. On success also sets the migration marker (see below). Returns `TrustResult`.                                                                              |
| `disenrol()`                    | no              | Delete the sentinel. Best-effort; swallows errors (item may already be gone).                                                                                                  |
| `verify({ promptCopy })`        | **yes**         | Probe the sentinel; if present, read it back behind the OS biometric sheet. Returns `TrustResult`.                                                                             |
| `hasEnrolment()`                | no              | Silent existence check for the sentinel.                                                                                                                                       |
| `isEnabled()` / `setEnabled(b)` | no              | Own the persisted `BIOMETRY_ENABLED_KEY` flag so callers never touch `UserPreferences` directly.                                                                               |
| `setBiometryEnabled(b)`         | yes if enabling | One-shot toggle: enrol+enable or disenrol+disable, keeping keychain state and the flag in sync. Returns the enrol `TrustResult` so the caller can roll back its UI on failure. |

### Two pieces of persisted state

Both live in `UserPreferences` (keys in `constants/localAuthentication.ts`):

1. **`BIOMETRY_ENABLED_KEY`** (`kBiometryEnabled`) — "the user wants biometric unlock." Owned by `isEnabled`/`setEnabled`. Referred to throughout the docs as **the flag**.
2. **`BIOMETRIC_TRUST_MIGRATION_V1_DONE`** (`kBiometricTrustMigrationV1Done`) — "this install is trust-initialized." Referred to as **the migration marker** or **the marker**.

The sentinel (keychain) is the third piece of state. The interplay between flag, marker, and sentinel is the entire subtlety of this subsystem — see "Migration" below.

### Why writing the sentinel is not consent

`enrol()` writes the sentinel silently — no biometric prompt — so it **cannot** double as proof the user agreed to biometric unlock. Callers that need real consent (the first-passcode opt-in in `checkBiometry`) must follow `enrol()` with a `verify()` prompt and tear the sentinel back down if the user declines. This is why `enrol` and the consent prompt are separate steps rather than one call. See `FLOWS.md` §2.

---

## Migration

`runBiometricTrustMigration` (`migration.ts`) is a one-shot upgrade path, run once at app init from the `restore` saga ([`../../../sagas/init.js`](../../../sagas/init.js)) **before** server/user restoration. It exists because users who enabled biometry _before_ the sentinel feature shipped have the flag set but no sentinel — there is nothing to detect enrolment changes against.

It is a pure function of three inputs: **flag** (`isEnabled()`), **sentinel** (`hasEnrolment()`), **marker** (the migration bool).

| flag  | sentinel |  marker   | Action                        | Why                                                      |
| :---: | :------: | :-------: | ----------------------------- | -------------------------------------------------------- |
| false |    —     |     —     | no-op                         | biometry not enabled; nothing to reconcile               |
| true  | present  |     —     | no-op                         | healthy: flag and sentinel agree                         |
| true  |  absent  | **false** | `enrol()`, set marker         | **grandfather**: pre-feature user, bind a sentinel once  |
| true  |  absent  | **true**  | `setEnabled(false)`, no enrol | **reconciliation**: flag/sentinel desync, clear the flag |

If `enrol()` fails during the grandfather path, the marker is intentionally left unset so the next boot retries, and the flag is left as-is so the next unlock falls into `verify()`'s `unavailable` branch and asks for the passcode.

### The invariant that makes the grandfather path safe

> **Every successful `enrol()` sets the migration marker** (`index.ts`).

This is the security-critical line. Without it, an app-driven enrol (settings toggle or first-passcode opt-in) would leave `marker = false`. A later enrolment-change invalidation (flag set, sentinel gone) would then route to the **grandfather** row instead of **reconciliation** — silently re-binding the sentinel to the _new_ (attacker-inclusive) enrolment on the next launch, since writing the sentinel doesn't prompt. That is exactly the bypass this subsystem exists to close.

Because `enrol()` sets the marker, any post-feature user always has `marker = true`, so a missing sentinel routes to **reconciliation** (clear the flag). Only genuine pre-feature users (`marker = false`) ever take the one-time grandfather branch.

---

## `resolveBiometricTrust` — outcome mapping

`resolveBiometricTrust(result)` (`resolveBiometricTrust.ts`) is the policy layer: it maps a `verify()` `TrustResult` onto a `BiometricTrustOutcome` — whether the app unlocks, and the modal config to show next.

```ts
type BiometricTrustOutcome =
	| { unlocked: true }
	| { unlocked: false; modal: { hasBiometry: boolean; reason?: 'enrollmentChanged' } };
```

| `verify()` kind      | Side effects                       | Outcome                                                                            |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `success`            | —                                  | `{ unlocked: true }`                                                               |
| `enrollmentChanged`  | `disenrol()` → `setEnabled(false)` | locked; modal hides biometry, shows the enrollment-changed subtitle                |
| `unavailable`        | `disenrol()` → `setEnabled(false)` | locked; modal hides biometry, **no** subtitle (can be benign — see `PLATFORMS.md`) |
| `canceled` / `error` | none                               | locked; modal **keeps** the biometry button so the user can retry                  |

### The disenrol-before-clear ordering invariant

> On any invalidation, `disenrol()` **must** run before `setEnabled(false)`.

If a crash happens between the two, the surviving state is _flag set, sentinel gone_ — which the migration's **reconciliation** row cleans up on the next launch. The reverse order would leave _flag cleared, sentinel live_, which looks like a healthy disabled state and orphans the sentinel forever (no path ever reconciles it).

---

## Invariants summary

1. **Writing/probing the sentinel never prompts; only `verify()` does.** Consent requires a `verify()`, not an `enrol()`.
2. **Every successful `enrol()` sets the migration marker.** Keeps app-driven enrols out of the grandfather branch.
3. **On invalidation, `disenrol()` precedes `setEnabled(false)`.** Keeps a crash recoverable by reconciliation.
4. **Flag and sentinel are kept in lockstep.** `setBiometryEnabled`, `checkBiometry`, and `resolveBiometricTrust` never leave one set without the other (the migration is the safety net for crashes that break this).
5. **The sentinel is `THIS_DEVICE_ONLY`.** It never restores across devices, so a restored backup correctly reads as `unavailable`.
