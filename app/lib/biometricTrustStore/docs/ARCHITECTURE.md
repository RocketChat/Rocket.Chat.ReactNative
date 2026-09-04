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

On **Android** that read is not a reliable prompt either: the keystore key behind it carries a 5-second auth window that accepts device credentials, so it can resolve silently. `verify()` is consequently an **iOS-only** presence check; Android proves presence with `expo-local-authentication` instead. `biometryAuth` owns that split — see `PLATFORMS.md`, "Why the sentinel read can't prove presence".

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

| Method                                      | Prompts? | Purpose                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enroll()`                                  | no       | Write the sentinel (and, on Android, bind the native probe key — see below; a probe that cannot be bound tears the sentinel back down and returns `unavailable`). On success also sets the migration marker (see below). Returns `TrustResult`.                                                                                          |
| `disenroll()`                               | no       | Delete the sentinel (and the Android probe key). Best-effort; swallows errors (item may already be gone).                                                                                                                                                                                                                                |
| `verify({ promptCopy })`                    | **yes**  | Probe the sentinel; if present, read it back behind the OS biometric sheet. Returns `TrustResult`.                                                                                                                                                                                                                                       |
| `hasEnrollment()`                           | no       | Silent existence check for the sentinel.                                                                                                                                                                                                                                                                                                 |
| `isEnrollmentValid()`                       | no       | Silent check that the _current_ enrollment still matches what trust was bound to. iOS always returns `true` (the sentinel already covers changes); Android consults the native probe key. Returns `false` only on a detected Android enrollment change. See `PLATFORMS.md`.                                                              |
| `isEnabled()` / `setEnabled(b)`             | no       | Own the persisted `BIOMETRY_ENABLED_KEY` flag so callers never touch `UserPreferences` directly.                                                                                                                                                                                                                                         |
| `isRelockPending()` / `setRelockPending(b)` | no       | Own the persisted relock marker (see "persisted state" below). Set when an enrollment change is detected at a point that cannot show the passcode itself (the init migration), so the next unlock is forced to demand it regardless of the auto-lock window.                                                                             |
| `setBiometryEnabled(b)`                     | no       | One-shot toggle: enroll+enable or disenroll+disable, keeping keychain state and the flag in sync. Returns the enroll `TrustResult` so the caller can roll back its UI on failure. The enable half captures no consent, so UI enable paths use `enableBiometry` (`localAuthentication.ts`) instead and reach this method only to disable. |

### Pieces of persisted state

Three live in `UserPreferences` (keys in `constants/localAuthentication.ts`):

1. **`BIOMETRY_ENABLED_KEY`** (`kBiometryEnabled`) — "the user wants biometric unlock." Owned by `isEnabled`/`setEnabled`. Referred to throughout the docs as **the flag**.
2. **`BIOMETRIC_TRUST_MIGRATION_V1_DONE`** (`kBiometricTrustMigrationV1Done`) — "this install is trust-initialized." Referred to as **the migration marker** or **the marker**.
3. **`BIOMETRIC_PENDING_RELOCK_KEY`** (`kBiometricPendingRelock`) — "force the passcode on the next unlock." Owned by `isRelockPending`/`setRelockPending`. Referred to as **the relock marker**. Set by the init migration when it consumes an enrollment-change signal (or grandfathers an untrusted baseline) on cold launch — because the migration runs _before_ `localAuthenticate`, it would otherwise swallow the signal silently and the session would unlock inside the auto-lock window. `handleLocalAuthentication`/`localAuthenticate` read it (OR-ed with the live `hasBiometricEnrollmentChanged()` check) and clear it once the forced passcode modal is shown. See `FLOWS.md` §3–§4.

The sentinel (keychain) is a further piece of state. On Android there is also the native probe key (see below), kept in lockstep with the sentinel. The interplay between flag, marker, relock marker, and sentinel is the entire subtlety of this subsystem — see "Migration" below.

### The Android native enrollment probe

On iOS a `BIOMETRY_CURRENT_SET` keychain item is _deleted_ by the OS when the enrollment set changes, so `hasEnrollment()` alone detects a change silently. On Android the keystore key backing such an item is only _invalidated_, not deleted — the sentinel survives an enrollment change, and the invalidation surfaces only as a `KeyPermanentlyInvalidatedException` the first time the key is _used_ (which, via `react-native-keychain`'s combined read, would show the biometric prompt). So Android needs a separate detector.

`nativeEnrollmentProbe.ts` bridges a dedicated native module (`android/.../biometric/BiometricEnrollmentModule.kt`) that keeps a standalone AES keystore key (`setInvalidatedByBiometricEnrollment = true`) bound to the current enrollment:

- **`enrollProbe()`** — create the probe key bound to the current enrollment, in lockstep with `enroll()`. **Fails closed:** `enroll()` refuses to enable biometry (`unavailable`, sentinel torn down, migration marker not written) when the probe cannot be bound. There is no `verify()` backstop to fall back on — the warm auto-lock unlock consults the probe _only_ (see `PLATFORMS.md`, "Where each guarantee comes from"), so an install with a sentinel but no probe key would report a change on its very next unlock and tear biometry down for a change that never happened. Better to fail the toggle the user is looking at than to break the unlock afterwards.
- **`disenrollProbe()`** — delete the probe key, in lockstep with `disenroll()`.
- **`isEnrollmentValid()`** — silent `cipher.init()` on the probe key: succeeds (no prompt) for a valid enrollment, throws `KeyPermanentlyInvalidatedException` once it changed. Returns `false` only on a detected change. A keystore-provider failure inside the native module resolves `true` so a transient error never forces the passcode on its own; a bridge-level failure (module missing, call rejects) resolves `false` and forces the passcode.

On iOS these helpers are no-ops that resolve `true` (the sentinel already covers enrollment changes). **Caveat:** `isEnrollmentValid()` never creates a key — a missing alias resolves `false`, i.e. "treat as changed", rather than self-healing to whatever is currently enrolled. It therefore says nothing about a change that happened _before_ a baseline was ever bound; it can only refuse to vouch for one. Establishing trust for a pre-feature user is the migration's job (see "Migration"), not the probe's.

### Why writing the sentinel is not consent

`enroll()` writes the sentinel silently — no biometric prompt — so it **cannot** double as proof the user agreed to biometric unlock. Every enable path must therefore follow `enroll()` with a `biometryAuth(true)` prompt and tear the sentinel back down if the user declines. That sequence lives in one place — `enableBiometry` in `localAuthentication.ts` — used by both the first-passcode opt-in (`checkBiometry`) and the settings toggle. This is why `enroll` and the consent prompt are separate steps rather than one call. See `FLOWS.md` §2.

The consent step goes through `biometryAuth`, not `verify()` directly, for the Android reason above: a `verify()` that resolves inside the keystore's auth window shows no prompt, which would silently enable biometric unlock the user was never asked about.

---

## Migration

`runBiometricTrustMigration` (`migration.ts`) is a one-shot upgrade path, run once at app init from the `restore` saga ([`../../../sagas/init.js`](../../../sagas/init.js)) **before** server/user restoration. It exists because users who enabled biometry _before_ the sentinel feature shipped have the flag set but no sentinel — there is nothing to detect enrollment changes against.

It is a pure function of three inputs: **flag** (`isEnabled()`), **sentinel** (`hasEnrollment()`), **marker** (the migration bool).

| flag  | sentinel |  marker   | Action                                                   | Why                                                                                     |
| :---: | :------: | :-------: | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| false |    —     |     —     | no-op                                                    | biometry not enabled; nothing to reconcile                                              |
| true  | present  |     —     | no-op                                                    | healthy: flag and sentinel agree                                                        |
| true  |  absent  | **false** | `setRelockPending(true)`, **then** `enroll()`            | **grandfather**: pre-feature user, bind a sentinel once and force a confirming passcode |
| true  |  absent  | **true**  | `setEnabled(false)`, `setRelockPending(true)`, no enroll | **reconciliation**: flag/sentinel desync, clear the flag and force the passcode         |

If `enroll()` fails during the grandfather path, the migration marker is intentionally left unset so the next boot retries, and the flag is left as-is so the next unlock falls into `verify()`'s `unavailable` branch and asks for the passcode. The relock marker armed up front stays set; it is self-clearing on the next forced unlock, so the cost is at most one spurious passcode prompt.

> **Ordering is load-bearing.** The relock marker is armed **before** `enroll()`, not after. `enroll()` persists both the sentinel and the migration marker before it resolves (and then awaits `enrollProbe()`), so arming afterwards leaves a window in which a force-kill or OOM strands a trusted — possibly attacker-inclusive — baseline with no debt recorded. The next launch would see flag + sentinel + marker, take the early return, and unlock with it: the exact bypass below, re-entered through its own fix. Over-arming costs one passcode prompt; under-arming costs the security property, so the ordering must fail toward the prompt.

### Why the grandfather path forces a passcode

A pre-feature user has the flag set but no sentinel — and, on Android, no probe key. There is therefore **no prior baseline** to compare the current enrollment against, so the migration cannot tell the user's _original_ enrollment apart from one an attacker altered before this first upgrade (adding their own fingerprint/face on a stolen device). If the grandfather path merely bound a sentinel/probe silently and trusted it, the next biometric unlock would succeed with that attacker-inclusive enrollment — the exact bypass this subsystem exists to close.

Nothing below the migration closes that gap, because **binding a baseline is not the same as validating one**. `enroll()` binds whatever is enrolled at that moment, by construction; the enrollment-change primitives can then only report that it hasn't changed _since_, which is trivially true and says nothing about what happened before. iOS has no probe at all, so its freshly-written sentinel simply reads back as valid. The relock marker is what supplies the missing evidence — a passcode the attacker doesn't have — and it is the migration's responsibility precisely because no lower layer is in a position to demand it.

> The Android probe happens to reach the same verdict by a different route: with no key yet, `isEnrollmentValid()` fails closed on the missing alias and reports a change, so it refuses to vouch for the grandfathered enrollment rather than trusting it. **That is a redundant second line, not the reason the relock exists** — it is Android-only and would disappear the moment the probe's missing-alias branch changed. Do not treat the relock as dead code on the strength of it.

So the grandfather branch sets the relock marker **and then binds the baseline**, forcing the next unlock to demand the passcode regardless of the auto-lock window. When that forced unlock fires, `handleLocalAuthentication` treats the pending relock like any enrollment-change signal: it tears the freshly-bound sentinel back down (`disenroll()`), clears the biometry flag (`setEnabled(false)`), and shows the passcode. The migration-bound baseline is therefore **not** trusted going forward — the user re-opts into biometry deliberately from settings, which re-binds the baseline through an explicit `biometryAuth(true)` consent prompt. This is a one-time cost on the first post-upgrade unlock for pre-feature biometry users: they authenticate with the passcode once and re-enable biometry if they still want it.

> **Copy.** The grandfather relock does **not** show the "Biometric enrollment changed" subtitle, because nothing changed. `BiometricInvalidationReason` carries three codes, all with the identical fail-closed handling and differing only in what the subtitle claims:
>
> | Reason              | Shown when                                                                                                                                                         | Claim                                              |
> | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
> | `enrollmentChanged` | The Android probe key reports the enrollment set changed, or a sentinel read raised `errSecItemNotFound`                                                           | The enrollment demonstrably changed                |
> | `trustLost`         | The sentinel is gone (the usual shape of a real iOS enrollment change — but equally of a restore onto a new device), or the init migration reconciled the flag off | Biometric unlock was turned off; no cause asserted |
> | `relockRequired`    | The enrollment checks all pass and only the relock marker is outstanding — i.e. this grandfather path                                                              | Nothing changed; one confirming passcode is owed   |
>
> The three-way split is derived in `getRelockReason`, so the persisted state stays a single boolean: `isEnabled()` plus the live enrollment check already distinguish the cases at the moment the modal opens. Replacing `kBiometricPendingRelock` with a persisted reason enum is still deliberately deferred — it would put a wider security-critical value on disk to buy nothing the derivation doesn't already give.

### The invariant that makes the grandfather marker safe

> **Every successful `enroll()` sets the migration marker** (`index.ts`).

This is a security-critical line. Without it, an app-driven enroll (settings toggle or first-passcode opt-in) would leave `marker = false`. A later enrollment-change invalidation (flag set, sentinel gone) would then route to the **grandfather** row instead of **reconciliation** — re-binding the sentinel to the _new_ (attacker-inclusive) enrollment on the next launch, since writing the sentinel doesn't prompt. (The grandfather relock above contains the damage even then, but routing through reconciliation is the correct, fail-closed path.)

Because `enroll()` sets the marker, any post-feature user always has `marker = true`, so a missing sentinel routes to **reconciliation** (clear the flag, force the passcode). Only genuine pre-feature users (`marker = false`) ever take the one-time grandfather branch.

---

## `resolveBiometricTrust` — outcome mapping

`resolveBiometricTrust(result)` (`resolveBiometricTrust.ts`) is the policy layer: it maps a `verify()` `TrustResult` onto a `BiometricTrustOutcome` — whether the app unlocks, and the modal config to show next.

```ts
type BiometricTrustOutcome =
	{ unlocked: true } | { unlocked: false; modal: { hasBiometry: boolean; reason?: 'enrollmentChanged' } };
```

| `verify()` kind      | Side effects                        | Outcome                                                                            |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `success`            | —                                   | `{ unlocked: true }`                                                               |
| `enrollmentChanged`  | `disenroll()` → `setEnabled(false)` | locked; modal hides biometry, shows the enrollment-changed subtitle                |
| `unavailable`        | `disenroll()` → `setEnabled(false)` | locked; modal hides biometry, **no** subtitle (can be benign — see `PLATFORMS.md`) |
| `canceled` / `error` | none                                | locked; modal **keeps** the biometry button so the user can retry                  |

Only `not_enrolled` and a genuinely absent sentinel produce `unavailable`; anything that merely
_failed_ produces `error`. See "A failed check is not a change" below.

### A failed check is not a change

`invalidate()` is irreversible: it deletes the sentinel and the probe key, clears the flag, and the
user has to re-opt-in from settings with no idea why the feature vanished. So only evidence about the
_enrollment_ may reach it. A check that could not complete is not that evidence, and three routes
used to conflate the two:

- **`classifyPresenceError`** — expo flattens the transient `ERROR_HW_UNAVAILABLE` (busy sensor, HAL
  hiccup) onto `not_available` together with `ERROR_NO_BIOMETRICS`, so mapping it to `unavailable`
  destroyed the enrollment over a momentarily busy sensor. It falls through to `error` instead, as
  `lockout` already did.
- **`getRelockReason`** (`localAuthentication.ts`) — collapsed every `checkBiometricEnrollment()`
  outcome that was not `valid` into "enrollment changed", including a throw from `hasEnrollment()` on
  either platform. It now returns a third state, **`checkFailed`**: the passcode is forced (still
  fail-closed, still overriding the auto-lock window) but nothing is torn down, no
  "enrollment changed" subtitle is shown, and the relock marker is deliberately left as it is so a
  persistent failure keeps forcing the passcode.
- **`NativeBiometricEnrollment`'s fallback** — answered `false` on Android when the module was absent
  from the build, which reads as an enrollment change for _every_ user on that build. It rejects
  instead, which surfaces as `checkFailed`. `nativeEnrollmentProbe.isEnrollmentValid()` no longer
  swallows that rejection into `false` either.

A `checkFailed` unlock keeps the biometry opt-in, so it self-recovers: once the transient condition
clears, the next check reads `valid` and biometry works again. A genuinely un-enrolled device instead
keeps a dead biometry button for one session, and `hasSupportedBiometry()` re-gates it on the next
lock.

> Known gap: `BiometricEnrollmentModule.isEnrollmentValid` still answers `false` for _any_ probe
> exception (`BiometricEnrollmentModule.kt`, final `catch`), because OEMs report invalidation
> inconsistently. That route still reaches `invalidate()`; narrowing it trades detection strictness
> for availability and has not been done.

### The disenroll-before-clear ordering invariant

> On any invalidation, `disenroll()` **must** run before `setEnabled(false)`.

If a crash happens between the two, the surviving state is _flag set, sentinel gone_ — which the migration's **reconciliation** row cleans up on the next launch. The reverse order would leave _flag cleared, sentinel live_, which looks like a healthy disabled state and orphans the sentinel forever (no path ever reconciles it).

---

## Invariants summary

1. **Writing/probing the sentinel never prompts, and presence is proved per platform.** Consent requires a prompt, so it requires `biometryAuth(true)`, not an `enroll()`. `verify()` proves presence on **iOS only**; Android uses `authenticateAsync({ disableDeviceFallback: true, biometricsSecurityLevel: 'strong' })`, because the sentinel's keystore key accepts a 5s device-credential window and can resolve with no prompt at all.
2. **Every successful `enroll()` sets the migration marker.** Keeps app-driven enrolls out of the grandfather branch.
3. **On invalidation, `disenroll()` precedes `setEnabled(false)`.** Keeps a crash recoverable by reconciliation.
4. **Flag and sentinel are kept in lockstep.** `setBiometryEnabled`, `enableBiometry`, and `resolveBiometricTrust` never leave one set without the other (the migration is the safety net for crashes that break this). On Android the native probe key is bound/torn down in lockstep with the sentinel inside `enroll()`/`disenroll()`.
5. **The sentinel is `THIS_DEVICE_ONLY`.** It never restores across devices, so a restored backup correctly reads as `unavailable`.
6. **A baseline bound without a prior baseline is never trusted silently.** When the migration consumes an enrollment-change signal (reconciliation) or binds a first baseline for a pre-feature user (grandfather) on cold launch, it sets the **relock marker** so the next unlock forces the passcode regardless of the auto-lock window — the migration runs before `localAuthenticate` and would otherwise swallow the signal.
