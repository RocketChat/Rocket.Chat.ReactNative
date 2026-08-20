# Biometric Trust Store Documentation

Entry point for documentation of the biometric trust store — the subsystem that lets screen lock detect when a device's biometric enrollment has changed and refuse to auto-unlock with it.

This is a **security control**, not a UX convenience. Its whole reason to exist is to defend against an *authentication-bypass-via-biometric-enrollment-change* attack: someone who knows the device passcode adds their own face/fingerprint, then expects to unlock the app with it. The trust store turns that enrollment change into a forced re-authentication.

## Index

| Document | Purpose |
| -------- | ------- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Subsystem structure: files, the keychain sentinel, the trust-store API, the `TrustResult` union, the migration state machine, and the invariants that keep keychain state and the enabled flag in sync |
| [`FLOWS.md`](FLOWS.md) | Sequence diagrams: enable/disable toggle, first-passcode opt-in, auto-unlock + enrollment-change detection, and the init-time migration |
| [`PLATFORMS.md`](PLATFORMS.md) | iOS vs Android quirks: how each OS signals an enrollment change, the `unavailable`-vs-`enrollmentChanged` divergence, and backup/restore edge cases |

## The subsystem at a glance

```
app/lib/biometricTrustStore/
  index.ts                 biometricTrustStore singleton + classifyError
  migration.ts             runBiometricTrustMigration (one-shot, runs at init)
  resolveBiometricTrust.ts maps a verify() TrustResult -> unlock outcome + modal config
  docs/                    you are here
```

Type contract and shared vocabulary live in [`../../../definitions/IBiometricTrustStore.ts`](../../../definitions/IBiometricTrustStore.ts). Keychain sentinel and storage keys live in [`../../constants/localAuthentication.ts`](../../constants/localAuthentication.ts).

### Consumers

- [`../../methods/helpers/localAuthentication.ts`](../../methods/helpers/localAuthentication.ts) — `enableBiometry` (shared enroll-then-consent path), `checkBiometry` (first-passcode opt-in), `biometryAuth` (verify wrapper), `handleLocalAuthentication` (opens the passcode modal).
- [`../../../containers/Passcode/PasscodeEnter.tsx`](../../../containers/Passcode/PasscodeEnter.tsx) — runs the biometry prompt *behind* the passcode modal and reacts to the outcome.
- [`../../../views/ScreenLockConfigView.tsx`](../../../views/ScreenLockConfigView.tsx) — the Screen Lock settings screen with the biometry toggle.
- [`../../../sagas/init.js`](../../../sagas/init.js) — runs `runBiometricTrustMigration` once during app restore, before server/user restoration.

## Read order

Start with `ARCHITECTURE.md` — `FLOWS.md` and `PLATFORMS.md` assume the vocabulary it defines (sentinel, `TrustResult` kinds, enabled flag, migration marker).
