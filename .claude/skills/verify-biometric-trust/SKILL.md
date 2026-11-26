---
name: verify-biometric-trust
description: Model-checks biometric unlock trust (app/lib/biometricTrustStore/index.ts, migration.ts, resolveBiometricTrust.ts, and enableBiometry, biometryAuth, getRelockReason, handleLocalAuthentication in app/lib/methods/helpers/localAuthentication.ts) across every crash between writes and every OS biometric change. Use before merging any change to those files, to the enabled or relock-pending flags, the Keychain sentinel or the Android enrollment key, or when biometry unlocks after a fingerprint/face change, the passcode is skipped after one, or the biometry toggle turns itself on.
metadata:
  covers:
    - app/lib/biometricTrustStore/index.ts
    - app/lib/biometricTrustStore/migration.ts
    - app/lib/biometricTrustStore/resolveBiometricTrust.ts
    - app/lib/biometricTrustStore/nativeEnrollmentCheck.ts
    - app/lib/methods/helpers/localAuthentication.ts
    - app/containers/Passcode/PasscodeEnter.tsx
    - app/lib/native/NativeBiometricEnrollment.ts
    - android/app/src/main/java/chat/rocket/reactnative/biometric/BiometricEnrollmentModule.kt
    - app/views/ScreenLockConfigView.tsx
    - app/views/SecurityPrivacyView.tsx
    - app/sagas/init.js
    - app/sagas/state.js
    - app/sagas/deepLinking.js
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify biometric trust

A tla-ts model of the four persisted trust bits and every flow that writes them, one write per step, checked for every order of events: a cold launch with its migration, locks inside and outside the auto-lock window, the passcode modal with its biometry button, the settings toggle on and off, a crash between any two writes, a failed best-effort delete, a fingerprint/face change in the OS, and the Keychain losing the sentinel. It runs on iOS and Android, from a fresh install or from an install made before the sentinel existed.

The persisted bits:

| Model variable | Code                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `enabled`      | `BIOMETRY_ENABLED_KEY` in UserPreferences                                                               |
| `pending`      | `BIOMETRIC_PENDING_RELOCK_KEY` in UserPreferences                                                       |
| `sentinel`     | the Keychain item under `BIOMETRIC_TRUST_SENTINEL_SERVICE`, bound with `BIOMETRY_CURRENT_SET`           |
| `key`          | the Android keystore key behind `NativeBiometricEnrollment` (`bindEnrollmentKey` / `isEnrollmentValid`) |

`bound` means written for the current biometric set, `stale` means the OS set changed since, `absent` means never written or deleted.

## Rules it checks

| Rule                              | Plain sentence                                                                                                                   | Harm when broken                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `enabledOnlyWithConsent`          | Biometry is on only after the user consented in the enable prompt.                                                               | A crash or failed prompt leaves biometric unlock on that the user never agreed to.                        |
| `noBiometricUnlockAfterTrustLoss` | After the biometric set changes or the sentinel is lost, no biometric prompt unlocks the app until the user re-enables biometry. | Someone who adds their own fingerprint or face to the device opens the app.                               |
| `trustLossForcesPasscode`         | After the biometric set changes while biometry is on, the next unlock asks for the passcode even inside the auto-lock window.    | A crash after the change, or a short lock, lets the app open with no passcode and no trace of the change. |
| `relockClearedOnlyAfterPasscode`  | The relock marker is cleared only after the user typed the passcode.                                                             | A biometric unlock erases the demand for a passcode that a trust loss left behind.                        |

The model also checks `NoDeadlock`: every state has a next step.

## When to run it

Run it when the diff touches any function in the coverage table below. Line numbers are at the sync commit; look the functions up by name if lines moved.

## Run

From the repo root:

```sh
.claude/skills/verify-biometric-trust/check.sh
```

It copies `model/biometricTrust.ts` to a fresh `mktemp -d` and runs `pnpm dlx tla-ts@0.0.10` there in about 2 s over 93,738 distinct states. It prints one line per rule: `HOLDS` when it holds, `NEW-BREAK` when it breaks, and `ERROR` when the model does not compile or TLC stopped before checking a rule. TLC stops at the first broken rule, so a `NEW-BREAK` leaves the other rules unchecked. The exit code is 0 only when every rule holds. No rule is known to break today.

After you edit the model or this skill, run the mutants too:

```sh
.claude/skills/verify-biometric-trust/check.sh --model
```

Each mutant breaks one guard in a copy of the model, keeps only the rule that guards it (TLC stops at the first broken rule), and expects that rule to break. Each line must say `CAUGHT`. `MISSED` means a rule no longer catches the break it guards. `STALE` means the mutation's target text changed in the model; update the mutation in `check.sh` to the new text of the same guard.

Read every broken rule with `/statechart`: copy `model/biometricTrust.ts` to a fresh `mktemp -d`, run its command on the copy with `--out` in that folder, and read its `report.md`. It lists each broken rule with its shortest path, in order. The state space is above the chart budget, so a passing run gives no chart, only the rule list.

## Bug or modeling error

For each broken rule, take the shortest path from `/statechart` and replay it against the real code, one action per step, with Jest:

- `unlockStarts`, `enterPasscode`, `clearRelock`, `enableBiometry` paths: `app/lib/methods/helpers/localAuthentication.test.ts` (mocks `biometricTrustStore`; set `isEnabled`, `hasEnrollment`, `isEnrollmentValid` and the relock state per step, then call `localAuthenticate` / `handleLocalAuthentication` / `enableBiometry`).
- `tapBiometry`: `app/containers/Passcode/PasscodeEnter.test.tsx` and `app/lib/biometricTrustStore/resolveBiometricTrust.test.ts`.
- `migrate`, `invalidateWrites`, `disableWrites`: `app/lib/biometricTrustStore/migration.test.ts` and `index.test.ts` (Keychain and UserPreferences are mocked; a crash is a test that stops after the Nth write and starts a fresh flow from the written values).

Then decide:

- The test reproduces the path: it is a bug in the code. Fix the code, not the model.
- A step cannot happen in the code (the code makes two model steps atomic, a guard exists in code but not in the model, an await the model treats as a crash point is actually synchronous): it is a modeling error. Fix the model so the step matches the code, cite the code in the action's comment, and rerun.

Never weaken a rule to make it pass.

## Coverage (sync commit `427648b7346c229a5b1ada3a0a596ff7c1af0842`)

| Model piece                                                  | Code                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasEnrollment`, `isEnrollmentValid`                         | `app/lib/biometricTrustStore/index.ts:108` `hasEnrollment`, `:114` `isEnrollmentValid` → `nativeEnrollmentCheck.ts`                                                                                                                                                   |
| `readTrustState`                                             | `app/lib/biometricTrustStore/index.ts:126` `readTrustState`                                                                                                                                                                                                           |
| `unlockStarts`, `enrollmentCheckReturns`, `reasonAfterCheck` | `app/lib/methods/helpers/localAuthentication.ts:252` `getRelockReason`: reads `readTrustState`, awaits `checkBiometricEnrollment` `:134`, then re-reads the marker through `hasPendingRelock` `:249`                                                                  |
| `handoffToModal`                                             | `app/lib/methods/helpers/localAuthentication.ts:353` `localAuthenticate` passes `relockReason` after `hideSplashScreen`; `handleLocalAuthentication` reads `isEnabled` only then                                                                                      |
| `overlappingUnlockInvalidates`                               | a second `localAuthenticate` from `app/sagas/state.js:30` or `app/sagas/deepLinking.js` that saw a biometric change, running `invalidate` during the first one's check or handoff                                                                                     |
| `biometryAuth`                                               | `app/lib/methods/helpers/localAuthentication.ts:146` `biometryAuth`; iOS `app/lib/biometricTrustStore/index.ts:91` `verify`                                                                                                                                           |
| `coldLaunch`, `migrate`                                      | `app/sagas/init.js:75`; `app/lib/biometricTrustStore/migration.ts:4` `runBiometricTrustMigration`                                                                                                                                                                     |
| `invalidateWrites`                                           | `app/lib/biometricTrustStore/index.ts:138` `invalidate`, `:82` `disenroll` (best-effort deletes)                                                                                                                                                                      |
| `finishRelockCheck`                                          | `app/lib/methods/helpers/localAuthentication.ts:313` `localAuthenticate` (`:344` reason, auto-lock window) → `:282` `handleLocalAuthentication`; the direct callers `ScreenLockConfigView.tsx:142` and `SecurityPrivacyView.tsx:63` read `isEnabled` before the check |
| `enterPasscode`, `clearRelock`                               | `handleLocalAuthentication` `authenticate` then `setRelockPending(false)`                                                                                                                                                                                             |
| `tapBiometry`                                                | `app/containers/Passcode/PasscodeEnter.tsx:42` `biometry` → `app/lib/biometricTrustStore/resolveBiometricTrust.ts:12`                                                                                                                                                 |
| `userEnablesBiometry`, `bindEnrollmentKey`, `consentPrompt`  | `app/views/ScreenLockConfigView.tsx:194` `toggleBiometry` → `app/lib/methods/helpers/localAuthentication.ts:196` `enableBiometry` → `app/lib/biometricTrustStore/index.ts:60` `enroll`                                                                                |
| `userDisablesBiometry`, `disableWrites`                      | `app/lib/biometricTrustStore/index.ts:150` `disableBiometry`; also the failure branches of `enableBiometry`                                                                                                                                                           |

Move the sync commit (here and `metadata.sync`) forward only to a commit on `develop`, after you have read the covered code at that commit and confirmed the model still describes it (or updated the model and rerun). Then update the line numbers in this table.

## Scope and assumptions

Covered: both platforms; fresh installs and installs from before the sentinel; a crash between any two persisted writes; failed best-effort deletes in `disenroll`; OS biometric changes and sentinel loss at any point, including mid-flow; Keychain/keystore read errors during the relock check (`checkFailed`).

Assumptions:

- `iosStaleSentinelVisible = false`: on iOS, `hasGenericPassword` answers NO for a sentinel the OS invalidated after a biometric change. The code relies on the same reading (`classifyError` treats `-25300` as an enrollment change). Flipped to `true`, `trustLossForcesPasscode` breaks: a lock inside the auto-lock window after a Face ID / Touch ID change opens the app without the passcode. Confirm it on a device before trusting the iOS half of that rule.
- `hasSupportedBiometry` is always true; a device that loses strong biometrics only hides the button.
- The enrollment check's read and its return are separate steps, so another unlock's marker write can land between them. An OS biometric change cannot land there in the model: the result is already read, so it is the same as a change just after the unlock.
- A second unlock is modeled only as its effect on this one (`overlappingUnlockInvalidates`), once per unlock, up to the modal opening; two full unlock flows are not interleaved, so a finished unlock clearing a newer marker while its modal animates out is not covered.
- A biometric cancel or error changes nothing, as `resolveBiometricTrust` keeps the button.

Not covered:

- The passcode itself (attempts, lockout timer), the per-server `autoLock` setting, and `checkHasPasscode` creating a first passcode.
- `migration.ts` swallowing a throwing `hasEnrollment` (the next unlock's check covers it).
- A relock reason other than the one `localAuthenticate` computed; no other caller passes one.
