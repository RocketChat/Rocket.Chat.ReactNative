---
name: verify-client-certificate-storage
description: 'Model-check how the iOS app stores and presents client (mTLS) certificates per host, across adding, selecting, logging out of and deleting workspaces and removing a certificate by hand. Use when a change touches app/lib/methods/helpers/sslPinning.ts, its callers in app/sagas/selectServer.ts, app/sagas/init.js, app/lib/methods/logout.ts or app/views/NewServerView/hooks/useCertificate.tsx, or the MMKV keys that ios/Libraries/Challenge.mm reads.'
metadata:
  covers:
    - app/lib/methods/helpers/sslPinning.ts
    - app/sagas/selectServer.ts
    - app/sagas/init.js
    - app/lib/methods/logout.ts
    - app/lib/database/services/Server.ts
    - app/views/NewServerView/index.tsx
    - app/views/NewServerView/hooks/useCertificate.tsx
    - ios/Libraries/Challenge.mm
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify client certificate storage

On iOS, a TLS handshake presents the client certificate stored in UserPreferences (MMKV) under the server's **hostname**. `Challenge clientCertificateCredentialForHost` reads that key. `sslPinning.ts` keeps it in step with two other keys: `RC_CERTIFICATE_KEY-<server>`, the certificate name a workspace uses, and `<certificate name>`, the picked file's path and password. Several of these operations `await getServerIds()` halfway through, so other steps can run in between.

`client-certificate-storage.ts` models those keys and every operation that writes them. Each exported action is one step with no `await` inside it. tla-ts checks every order of steps, for two workspaces (`A`, `B`) on one host and two certificates (`c1`, `c2`).

## Rules

Each rule is checked only once things settle: no workspace is being added, and no `getServerIds` is pending.

| Rule                                       | Sentence                                                                                             | Harm when broken                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `connectedWorkspacePresentsItsCertificate` | The app presents the connected workspace's certificate to its host.                                  | The server rejects the handshake ("requires a client certificate") and the workspace can't connect. |
| `savedCertificateStaysLoadable`            | Every certificate a workspace still names can be loaded.                                             | `applyServerCertificate` silently does nothing, so selecting that workspace sends no certificate.   |
| `removedCertificateIsNotPresented`         | A certificate the user removed by hand is not presented unless a workspace still names it.           | The app keeps sending a certificate the user asked to remove.                                       |
| `hostCertificateHeldOnlyWhileUsed`         | The host keeps a certificate only while a workspace on it is listed or still names that certificate. | The certificate of a deleted workspace is still presented to that host.                             |

## Run

From the repo root:

```sh
SKILL_DIR=.claude/skills/verify-client-certificate-storage .claude/skills/verify-client-certificate-storage/check.sh
```

It copies the model to a fresh `mktemp -d` and runs tla-ts three times, about 8 seconds in all: once for the rules expected to hold, and once with `-continue` for each known finding, counting the states that break it. It prints one line per rule and exits 0 only when every line matches the record in `check.sh`:

```
HOLDS savedCertificateStaysLoadable
HOLDS removedCertificateIsNotPresented
BROKEN-AS-RECORDED connectedWorkspacePresentsItsCertificate (84 violating states)
BROKEN-AS-RECORDED hostCertificateHeldOnlyWhileUsed (16 violating states)
```

The counts are violating states, not distinct bugs. `NEW-BREAK` means a rule breaks that held, or a known finding breaks in a different number of states: the change altered behavior. `FIXED` means a known finding now holds: update the findings below and `recorded_breaks` in `check.sh`. `ERROR` means the model did not compile or run.

After editing the model, run `check.sh --model`. It also breaks one guard per rule and expects that rule to break in more states (`CAUGHT`). `MISSED` means a rule no longer catches the break it guards; `STALE` means the guard's text changed in the model, so update that mutation in `check.sh` to the new text of the same guard.

Read the shortest path to each broken rule with `/statechart`, on a copy of `client-certificate-storage.ts` and `client-certificate-storage.view.ts` in a fresh `mktemp -d`. The view file labels states and steps in plain words. Its report checks rules after the first break with a cap of 100,000 states, so judge which rules hold from `check.sh`, not from its "Rules not checked" list.

tla-ts writes `ClientCertificateStorage.tla`, `.cfg` and `_TTrace_*` files next to the model it runs. They are build output: never commit them.

## Known findings at the sync commit

1. **`hostCertificateHeldOnlyWhileUsed` (reached with ordinary steps).**
   1. Add workspace A with certificate c1 and log in.
   2. Add workspace B on the same host without a certificate and log in.
   3. Delete A from the workspace list. `clearRemovedWorkspaceCertificate` forgets A's keys and the `c1` file entry, but keeps the hostname entry, because B has no certificate of its own.
   4. Log out of B. `logout()` never touches certificate keys.

   Result: the hostname entry still holds c1's path and password, and no workspace names c1. The next connection to that host presents c1. The keep in step 3 is intended (the test "keeps the host entry for a workspace on the host without a certificate of its own" in `app/lib/methods/helpers/__tests__/sslPinning.test.ts` covers it). Whether c1 should outlive B's logout is an open product decision.

2. **`connectedWorkspacePresentsItsCertificate` (reached only through a race).**
   1. In NewServerView, type A and pick c1.
   2. Remove the certificate. `forgetServerCertificate` runs and `getServerIds` starts.
   3. Before `getServerIds` resolves, pick c1 again and connect A.
   4. `syncHostCertificate` continues with the empty server list it loaded and clears the hostname entry.

   Result: A is connected and names c1, but the host presents nothing. Step 3 needs a document pick and a login inside one database read. The model has no clock, so this path may not be reachable in practice. It stops breaking once user gestures are barred while a `getServerIds` is pending.

## A real bug or a modeling error

Replay the path against the real code before calling it a bug. Each model action maps to an entry point (see Coverage). For a path that stays in JS, drive `sslPinning.ts` through the same steps in `app/lib/methods/helpers/__tests__/sslPinning.test.ts`. Its iOS `describe` block already mocks UserPreferences, the servers database and the native module. When the replay does not show the bug, treat the model as wrong: find the step it gets wrong, fix the model, and rerun.

Never weaken a rule or delete an action to make the run pass. A rule the code breaks stays a finding until the code changes.

## Coverage

The sync commit is `metadata.sync`. Move it forward only after you confirm that every row still describes the code at the new commit.

| Model                                                                                                                  | Code                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspaceCertificate`                                                                                                 | `RC_CERTIFICATE_KEY-<server>`: `getServerCertificateKey`, `getServerCertificate` in `app/lib/methods/helpers/sslPinning.ts`                                 |
| `certificateFile`                                                                                                      | `UserPreferences.setMap(name, …)` in `persistCertificate`; read by `getMap(name)` in iOS `setCertificate`                                                   |
| `hostCertificate`                                                                                                      | `UserPreferences.setMap(hostname, …)` in `persistCertificate`; read by `clientCertificateCredentialForHost` in `ios/Libraries/Challenge.mm`                 |
| `listed`                                                                                                               | `getAllServers` in `app/lib/database/services/Server.ts`, through `getServerIds`                                                                            |
| `connected`                                                                                                            | `reduxStore.getState().server.server`, read by `pickCertificateServerPerHost`                                                                               |
| `persistCertificate`, `applyServerCertificate`, `forgetServerCertificate`, `isCertificateInUse`, `syncHostCertificate` | Functions of the same names in `sslPinning.ts`. `firstWithCertificate` plus the connected check mirror `pickCertificateServerPerHost`                       |
| `openAddWorkspace`, `leaveAddWorkspace`                                                                                | NewServerView opening, and its back handler dispatching `selectServerRequest(previousServer)` (`app/views/NewServerView/index.tsx`)                         |
| `pickCertificate`                                                                                                      | iOS `RCSSLPinning.pickCertificate` (after `copyAsync`)                                                                                                      |
| `connectAddedWorkspace`                                                                                                | `handleServerRequest` then `handleSelectServer` in `app/sagas/selectServer.ts`, both calling `applyServerCertificate`, then login listing the server        |
| `selectWorkspace`                                                                                                      | `handleSelectServer`, including app start restoring `CURRENT_SERVER` (`restore` in `app/sagas/init.js`; iOS `registerCertificates` does nothing)            |
| `logOut`                                                                                                               | `logout` in `app/lib/methods/logout.ts`: `removeServerData` unlists; no certificate call                                                                    |
| `removeWorkspace`, `removeWorkspaceLoadsServers`, `removeWorkspaceClearsCertificate`                                   | `removeServer` in `logout.ts` up to `removeServerData`, then `clearRemovedWorkspaceCertificate` before and after `await getServerIds()`                     |
| `unsetCertificate`, `unsetCertificateLoadsServers`, `unsetCertificateSyncsHost`                                        | `removeCertificate` in `useCertificate.tsx` calling iOS `removeServerCertificate`: `forgetServerCertificate`, `await getServerIds()`, `syncHostCertificate` |
| `removedByHand`                                                                                                        | Ghost variable for `removedCertificateIsNotPresented`; no code counterpart                                                                                  |

## When the code changes

1. Run `git diff <metadata.sync> -- <metadata.covers>` and see whether any row above changed.
2. Mirror each change in the model: same step boundaries (one action per stretch between `await`s), same key writes, same names.
3. Run `check.sh --model`. A rule that newly breaks: read its path with `/statechart` and replay it as above.
4. If the change is meant to fix a known finding, the rule should now hold. Update the findings below, the expected output above and `recorded_breaks` in `check.sh`.
5. Move `metadata.sync` forward.

## Not covered

- Android: certificates go through KeyChain aliases in `SSLPinningTurboModule.java`, not the hostname key.
- Native presentation: whether `Challenge.mm`, the Expo fetch hook in `ios/Libraries/SSLPinning.mm`, SDWebImage and the SocketRocket websocket actually read the hostname key. Also server-trust handling, and the Watch copy (`removeWatchCertificate`).
- More than one host. Hosts never share keys, since every write goes to the hostname of its own server. More than two workspaces or two certificates.
- Two deletions, or two hand removals, in flight at once. App kill partway through an operation.
- Database order: `getAllServers` is fixed to A before B. A and B play the same roles in the model, so this loses no behavior.
- Time: a path can need a user gesture inside a database read, which the model allows and a person can't do.
- A `.p12` file missing from disk, or a native call that fails. The model counts a stored file entry as loadable, while `credentialForPath` in `Challenge.mm` returns nil for a missing file.
