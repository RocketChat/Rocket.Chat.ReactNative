# Biometric Trust Store Flows

Sequence diagrams for the handshakes between the screen-lock UI, the trust store, and the OS keychain. Each diagram describes ordering and ownership; method signatures live in the code, not here. Read `ARCHITECTURE.md` first — these diagrams use its vocabulary (sentinel, flag, marker, `TrustResult` kinds).

Participants used below:

- **Settings** — `ScreenLockConfigView.tsx`
- **Passcode** — `PasscodeEnter.tsx`
- **LocalAuth** — `methods/helpers/localAuthentication.ts`
- **Store** — `biometricTrustStore` (`index.ts`)
- **Resolve** — `resolveBiometricTrust.ts`
- **OS** — `react-native-keychain` → platform keychain / keystore

---

## 1. Enable / disable from the settings toggle

`toggleBiometry` routes the whole on/off operation through `setBiometryEnabled`, which keeps the keychain and the flag in sync and reports failure so the switch can roll back.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Settings
    participant Store
    participant OS

    User->>Settings: flip biometry switch ON
    Settings->>Store: setBiometryEnabled(true)
    Store->>OS: enroll() — setGenericPassword (BIOMETRY_CURRENT_SET, silent)
    alt write succeeds
        OS-->>Store: ok
        Store->>Store: set migration marker = true
        Store->>Store: setEnabled(true)
        Store-->>Settings: { kind: 'success' }
    else write fails / unsupported
        OS-->>Store: error
        Store->>Store: setEnabled(false)
        Store-->>Settings: failure TrustResult
        Settings->>Settings: revert switch to OFF
    end

    User->>Settings: flip biometry switch OFF
    Settings->>Store: setBiometryEnabled(false)
    Store->>OS: disenroll() — resetGenericPassword (best-effort)
    Store->>Store: setEnabled(false)
    Store-->>Settings: { kind: 'success' }
```

Note the enable path does **not** prompt for biometrics — writing the sentinel is silent. The toggle treats "sentinel written" as enough; explicit consent is only required on the first-passcode opt-in (flow 2), where there is no prior screen-lock context.

---

## 2. First-passcode opt-in (`checkBiometry`)

When the user sets their first passcode, screen lock asks whether to also enable biometric unlock. Because `enroll()` is silent, consent is captured with a **second** call — a `verify()` prompt — and the sentinel is torn down if the user declines.

```mermaid
sequenceDiagram
    autonumber
    participant LocalAuth
    participant Store
    participant OS
    participant User

    Note over LocalAuth: checkHasPasscode set a new passcode → checkBiometry()
    LocalAuth->>Store: enroll() — write sentinel (silent)
    alt enroll fails
        Store-->>LocalAuth: failure
        LocalAuth->>Store: setEnabled(false)
    else enroll succeeds
        Store->>Store: set migration marker = true
        Store-->>LocalAuth: success
        LocalAuth->>Store: verify({ cancel: "Don't activate" })
        Store->>OS: getGenericPassword → OS biometric sheet
        OS->>User: prompt
        alt user authenticates
            User-->>OS: ok
            OS-->>Store: sentinel value
            Store-->>LocalAuth: { kind: 'success' }
            LocalAuth->>Store: setEnabled(true)
        else user taps "Don't activate"
            User-->>OS: cancel
            Store-->>LocalAuth: { kind: 'canceled' }
            LocalAuth->>Store: disenroll() — tear sentinel back down
            LocalAuth->>Store: setEnabled(false)
        end
    end
```

The `verify()` here doubles as the consent prompt: succeeding means the user agreed _and_ proved the current enrollment works; declining opts out and cleans up.

---

## 3. Auto-unlock and enrollment-change detection

The most security-sensitive flow. When auto-lock fires, `handleLocalAuthentication` opens the passcode modal **first** so the app content is covered, then `PasscodeEnter` prompts biometry from _behind_ the modal. Prompting before the modal exists would flash the app content under the OS sheet and defeat screen lock.

```mermaid
sequenceDiagram
    autonumber
    participant LocalAuth
    participant Passcode
    participant Store
    participant OS
    participant Resolve

    LocalAuth->>Passcode: openModal(hasBiometry) — modal now covers the app
    Note over Passcode: on mount, status === ENTER → auto-run biometry()
    Passcode->>Store: verify({ promptCopy })
    Store->>OS: hasEnrollment()? (silent)
    alt sentinel present
        OS-->>Store: yes
        Store->>OS: getGenericPassword → OS biometric sheet
        alt biometric matches & value read back
            OS-->>Store: 'v1'
            Store-->>Passcode: { kind: 'success' }
        else iOS: errSecItemNotFound after prompt
            OS-->>Store: -25300
            Store-->>Passcode: { kind: 'enrollmentChanged' }
        else Android: KeyPermanentlyInvalidatedException
            OS-->>Store: exception
            Store-->>Passcode: { kind: 'enrollmentChanged' }
        else user cancels
            OS-->>Store: -128
            Store-->>Passcode: { kind: 'canceled' }
        end
    else sentinel absent (iOS often lands here first — see PLATFORMS.md)
        OS-->>Store: no
        Store-->>Passcode: { kind: 'unavailable' }
    end

    Passcode->>Resolve: resolveBiometricTrust(result)
    alt success
        Resolve-->>Passcode: { unlocked: true }
        Passcode->>LocalAuth: finishProcess() — app unlocks
    else enrollmentChanged / unavailable
        Resolve->>Store: disenroll()
        Resolve->>Store: setEnabled(false)
        Resolve-->>Passcode: { unlocked:false, modal:{ hasBiometry:false, reason? } }
        Note over Passcode: hide biometry button in-place,<br/>show enrollment-changed subtitle if reason set,<br/>user must enter passcode
    else canceled / error
        Resolve-->>Passcode: { unlocked:false, modal:{ hasBiometry:true } }
        Note over Passcode: keep biometry button for manual retry
    end
```

`PasscodeEnter` mirrors `hasBiometry`/`reason` in local state so an invalidation hides the button **within the same modal session** without re-emitting `LOCAL_AUTHENTICATE_EMITTER` (which would orphan the upstream `openModal` promise).

---

## 4. Init-time migration

Runs once per launch from the `restore` saga, before any server/user restoration. Pure decision over flag/sentinel/marker — see the truth table in `ARCHITECTURE.md`.

```mermaid
flowchart TD
    A[runBiometricTrustMigration] --> B{flag enabled?}
    B -- no --> Z[no-op]
    B -- yes --> C{sentinel exists?}
    C -- yes --> Z
    C -- no --> D{marker set?}
    D -- "no (pre-feature user)" --> E[enroll]
    E --> F{enroll ok?}
    F -- yes --> G[set marker = true<br/>setRelockPending true]
    F -- no --> H[leave marker, flag & relock<br/>next boot retries; unlock asks passcode]
    D -- "yes (post-feature desync)" --> I[setEnabled false<br/>clear the flag<br/>setRelockPending true]
```

The grandfather branch (`marker = no`) is reachable only by users who enabled biometry before the sentinel feature existed. Every app-driven `enroll()` sets the marker, so post-feature users with a missing sentinel always reach the reconciliation branch instead — closing the silent re-bind.

Both the grandfather and reconciliation branches set the **relock marker**. The freshly-bound grandfather baseline is untrusted — there was no prior enrollment to compare against, so an attacker who altered the enrollment before this first upgrade would otherwise be silently trusted (on Android the native probe can't catch this either: with no key yet, `isEnrollmentValid()` just creates a fresh baseline and reports valid). The migration runs **before** `localAuthenticate`, so it persists the relock marker; the next unlock (§3) reads it (OR-ed with the live enrollment-change check), forces the passcode regardless of the auto-lock window, and clears it once the modal is shown.
