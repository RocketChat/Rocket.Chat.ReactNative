---
name: verify-key-distribution
description: Model-checks the E2EE client across sign-in, reconnect, logout, workspace switch and account deletion, in two models. Key distribution in app/lib/encryption/encryption.ts (initiateKeyDistribution and its keyDistribution closure and isStale, getSample, getSuggestedE2EEKeys, getRoomInstance, initialize, stop). Client start in handleEncryptionInit (app/sagas/encryption.js) with persistKeys and createKeys. Use before merging any change to those functions, to keyDistributionInterval, the distributing flag or roomInstances, to where encryptionStop/encryptionInit are dispatched, to the stored E2E keys or e2eSetUserPublicAndPrivateKeys, or when room keys are sent after logout or from the wrong account, a new sign-in stops distributing keys, E2E keys come back after logout, or a user is asked for an E2E password they never set.
metadata:
  covers:
    - app/lib/encryption/encryption.ts
    - app/sagas/encryption.js
    - app/sagas/login.js
    - app/sagas/selectServer.ts
    - app/lib/methods/logout.ts
    - app/lib/services/connect.ts
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify key distribution

Two tla-ts models of the code on `develop`. The first, `model/keyDistribution.ts`, covers the E2EE key distribution loop: the code breaks four of its five rules, because a run left over from an ended session never checks for the stop. The second, `model/encryptionInit.ts`, covers how `handleEncryptionInit` starts the client: the code breaks all four of its rules. See [Findings](#findings-on-develop) and [Client start: handleEncryptionInit](#client-start-handleencryptioninit).

## Run

From the repo root, with `SKILL_DIR` set to this folder:

```sh
$SKILL_DIR/check.sh          # every rule of both models against its recorded verdict, and the Jest replays
$SKILL_DIR/check.sh --model  # fix sketches, mutants and bigger bounds
```

Run `check.sh` on every change to covered code, and `check.sh --model` when this skill's own files change. Both exit 0 only when every line matches the record. Each prints one line per rule, replay or mutant, then the fresh `mktemp -d` folder that holds every model copy and tool output:

- `HOLDS`: a rule recorded as holding holds.
- `BROKEN-AS-RECORDED`: the code breaks a rule, as recorded. A rule recorded as broken gets its own TLC run, because TLC stops at the first broken rule.
- `FIXED`: a rule recorded as broken now holds. Update the record in `check.sh` and the findings here.
- `NEW-BREAK`: a rule recorded as holding is broken.
- `CAUGHT` / `MISSED`: a mutant breaks the rule it targets, or does not.
- `STALE`: a fix sketch or mutation no longer finds its target text in the model. Update it to the new text of the same code.
- `ERROR`: tla-ts or Jest failed to run, or a model exports rules the record does not list.

The recorded verdicts are the rule lists at the top of `check.sh`.

## Key distribution

The key distribution model is checked for every order of events in a small world:

- two sign-ins (two users), with a stop between them (logout, workspace switch or account deletion);
- each sign-in starting `handleEncryptionInit`, which reaches `initialize` later, after its awaits (or after password entry), so runs, stops and the interval can all land in between;
- reconnects that put `ENCRYPTION.INIT` again for the same user;
- the interval firing at any time;
- every await of a run (the subscriptions query, each getSample pass, whose room handshakes start in one tick and are awaited together, plus its smaller-limit retry, `fetchUsersWaitingForGroupKey`, `getSuggestedE2EEKeys`, `provideUsersSuggestedGroupKeys`) resolving at any point, so a stop can land inside any of them;
- a stop followed by a new init for the same user (`signIn` after `stop` with the same user), which is what logging out and back in as the same user does.

Each await's outcome is chosen freely: no rooms, rooms for one getSample pass, or more rooms than the limit (so a pass that finds none retries), a room with or without a session key, users waiting or not, keys encrypted or not.

### Rules it checks

| Rule                       | Plain sentence                                                                                           | Harm when broken                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `noStaleRoomHandshake`     | After a stop, no run left over from the ended session starts a room handshake.                           | A logged-out session fetches room keys, or creates a room key, through whatever client is now connected, possibly another workspace. |
| `noStaleWaitingUsersFetch` | After a stop, no run left over from the ended session asks the server which users wait for room keys.    | Room ids from the old workspace are sent to the server the app is now connected to.                                                  |
| `noStaleKeyProvide`        | After a stop, no run left over from the ended session sends suggested room keys to the server.           | Room keys encrypted by the old account reach the server under the new sign-in.                                                       |
| `stoppedHoldsNoRooms`      | While the client is stopped, it holds no room instances.                                                 | Room keys of the signed-out account stay in memory after logout.                                                                     |
| `noSkipByOtherSession`     | A session's key distribution never skips a run because a run from an earlier session is still in flight. | After a sign-in, waiting users get no room keys until the old run finishes.                                                          |

### When to run it

Run it when the diff touches any function in the coverage table below, or the `encryptionStop`/`encryptionInit` dispatches. The table records line numbers at the sync point; look the functions up by name if lines moved.

### Findings on develop

`keyDistribution` on `develop` has no stale check: once a run is past its first await, `stop()` cannot end it. So the code breaks `noStaleRoomHandshake`, `noStaleWaitingUsersFetch`, `noStaleKeyProvide` and `stoppedHoldsNoRooms`. `noSkipByOtherSession` holds (over 3,448 distinct states), because `distributing` is a local of each `initiateKeyDistribution` call. Shortest path for all four:

- U1 signs in and the client starts a run, which waits on the subscriptions query;
- the user logs out or switches workspace: `stop()` clears `roomInstances` and the interval;
- the query resolves, and the leftover run calls `getRoomInstance`, which creates an `EncryptionRoom` again and starts its handshake on whatever client is now connected;
- it goes on to `fetchUsersWaitingForGroupKey` and `provideUsersSuggestedGroupKeys` with the old session's rooms and keys.

The pull request "fix: cancel an in-flight E2EE key distribution run on logout" (https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7924) adds an `isStale` check (`this.keyDistributionInterval !== interval`) at the top of `getSample` and after each await of `keyDistribution`. `check.sh --model` applies that fix as a sketch: every rule holds over 1,013 distinct states, and over 10,213 at three sessions. When the fix lands on `develop`, `check.sh` prints `FIXED` for the four rules: port the sketch into the model, move those rules to the holding list in `check.sh`, and keep the mutants that remove one check each.

To see every broken rule with its shortest path, read the result with `/statechart`: run it on a copy of `model/keyDistribution.ts` and `model/keyDistribution.view.ts` in a fresh `mktemp -d`, and read its `report.md`. Read every result that way before deciding what it means. The model is past the 500-state chart budget, so no chart is drawn; to see one, run a copy with `MAX_SESSIONS = 1`.

### Bound

The bound is `MAX_SESSIONS = 2`. `check.sh --model` reruns the fix sketch at 3 (with a fourth `false` in `distributing` and `index: 0 | 1 | 2` in the run actions). After a model change, also rerun the model as it is at 3 in a fresh `mktemp -d`; trust the result only when the set of broken rules stays the same.

### Bug or modeling error

For each broken rule, take the shortest path from `/statechart` and replay it against the real code in `app/lib/encryption/encryption.test.ts`, in the `Encryption key distribution` block:

- `encryption.initiateKeyDistribution()` is the distribution start in `initializeRuns`; set `encryption.userId` first. A path that needs the init saga's awaits goes in the replay harness of the second model, `replays/encryptionInitRace.test.ts`.
- `encryption.stop()` is `stop`.
- A `Deferred` returned by a mock holds one await open (subscriptions query, handshake, `fetchUsersWaitingForGroupKey`, `encryptGroupKeyForParticipantsWaitingForTheKeys`), as `stops distributing room keys when the client stops during the first run` does for the query; `resolve()` on it is the matching `…Resolves` action.
- `jest.advanceTimersByTimeAsync(KEY_DISTRIBUTION_INTERVAL)` is `intervalFires`.

Then decide:

- The test reproduces the path: it is a bug in the code. Fix the code, not the model.
- A step cannot happen in the code: it is a modeling error. Examples: an await the model splits where the code has none (so a stop cannot land there), a stop without a dispatched `encryptionStop`, a handle `setInterval` returns twice. Fix the model so the step matches the code, cite the code in the action's comment, and rerun.

Never weaken a rule to make it pass. The rules read their own `sessionEnded`, not a stale check from the code, so a broken check cannot hide what it lets through; keep it that way.

### Coverage (synced to `develop` at 427648b734)

Both coverage tables use this sync point.

| Model piece                                 | Code                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keyDistributionInterval`, `nextHandle`     | `app/lib/encryption/encryption.ts:533` `this.keyDistributionInterval = setInterval(...)`, then `await keyDistribution()` `:534`; handles are never reused                                                                                                                                                                                       |
| `sessionEnded`                              | rule bookkeeping only: the run's interval is no longer the live one. The code has no stale check                                                                                                                                                                                                                                                |
| `signIn`, `initPendingFor`                  | `app/sagas/login.js:335` `put(encryptionInit())` in `handleLoginSuccess` `:328`, forked by `root` for each `LOGIN.SUCCESS` it takes `:499`–`:500` → `app/sagas/encryption.js:35` `handleEncryptionInit`, which awaits server info, `e2eFetchMyKeys` and `persistKeys` or `createKeys` before `initialize`                                       |
| `reconnect`                                 | `login.js:335` on every login success, including reconnects; `takeLatest(ENCRYPTION.INIT)` (`encryption.js:148`) restarts the saga for the same user                                                                                                                                                                                            |
| `initializeRuns`                            | `encryption.js:100` (and `:130` in `handleEncryptionDecodeKey`) → `encryption.ts:95` `initialize`: sets `userId`, clears `roomInstances`, calls `initiateKeyDistribution` `:487` (returns early on a live interval `:488`), which runs `keyDistribution` once                                                                                   |
| `stop`                                      | `encryption.ts:122` `stop`: clears `userId`, `roomInstances`, `clearInterval`, sets the interval to null. The model also drops a pending init here, which nothing in the code does: see Scope. Dispatched by `login.js:401` `handleLogout`, `login.js:470` `handleDeleteAccount`, `app/sagas/selectServer.ts:168` before every workspace switch |
| `distributing`, `flagOf`, `keyDistribution` | the `let distributing` local of each `initiateKeyDistribution` call, `encryption.ts:492`–`:497`                                                                                                                                                                                                                                                 |
| `queryResolves`                             | `encryption.ts:501` `await subCollection.query(...)`, then filtering on `this.userId` and `getSample` `:507`                                                                                                                                                                                                                                    |
| `sampleNext`, `sampleHandshakeResolves`     | `encryption.ts:470` `getSample`: `if (limit === 0) return []` `:471`, then every sampled room's `getRoomInstance` starts in one tick and `await Promise.all` `:477`; a pass that finds no room retries with a smaller limit `:481`                                                                                                              |
| `startHandshake`                            | `encryption.ts:290` `getRoomInstance`: creates the `EncryptionRoom` when missing and awaits its `handshake()`                                                                                                                                                                                                                                   |
| `afterSample`                               | `encryption.ts:509` `if (!sampleIds.length) return;`, then `fetchUsersWaitingForGroupKey` `:513`                                                                                                                                                                                                                                                |
| `waitingUsersResolve`                       | `encryption.ts:514`–`:518`: `if (!result.success \|\| …) return;`, then `getSuggestedE2EEKeys` `:446`, which calls `getRoomInstance` for each room before its first await                                                                                                                                                                       |
| `suggestedKeysResolve`, `provideResolves`   | `encryption.ts:520`–`:524`: `if (!Object.keys(userKeysWithRooms).length) return;`, then `await provideUsersSuggestedGroupKeys`                                                                                                                                                                                                                  |
| `finish`                                    | the `finally { distributing = false; }` of `keyDistribution` `:529`                                                                                                                                                                                                                                                                             |

Move the sync commit forward only after you have read the covered code at the new commit and confirmed the model still describes it (or updated the model and rerun). Then update the line numbers in this table.

### Scope and assumptions

Covered: stops landing inside every await of a run, a second sign-in while the old run is still in flight, the init saga's delay before `initialize`, reconnects, the interval firing during a run, and the per-session `distributing` flag.

Not covered:

- What happens inside a handshake or `encryptGroupKeyForParticipantsWaitingForTheKeys` (`app/lib/encryption/room.ts`). A run that is stale while it encrypts still finishes the encryption, which is local crypto with no network call; the stale check after it keeps the keys from being sent.
- Which rooms are sampled, and more than one smaller-limit retry. The model's "more rooms than the limit" allows one retry pass.
- Errors thrown by any await: they log and end the run through the same `finally`, like an empty result.
- A stop that does not cancel a pending init. This model assumes a stop drops it, which is the NATIVE-1975 fix (https://rocketchat.atlassian.net/browse/NATIVE-1975). Today nothing cancels it: a late `initialize` after a stop starts a new interval, which is the live one, so even the fix's `isStale` cannot catch it. The second model below covers that bug.
- `decryptPendingSubscriptions` and `decryptPendingMessages`, which `initialize` also starts and which do not check for a stop.
- The Jest tests on `develop` (`Encryption key distribution` in `app/lib/encryption/encryption.test.ts`) only stop the client while the query is open and resolve it with no subscriptions, so none of them reaches the broken rules.

## Client start: handleEncryptionInit

A tla-ts model of how `handleEncryptionInit` starts the Encryption client, and of the key work it starts in `persistKeys` and `createKeys`. It checks every order of events in a small world:

- two workspaces, A and B, each with one user (the workspace's name also names its user and that user's keys);
- A's user has no E2E keys yet; B's user starts either with no keys or with keys on the server and on this device;
- up to three logins, two stops (logout or workspace switch), a switch that is cancelled by selecting the connected workspace again before `connect()` runs, and every await of the init (server info, `e2eFetchMyKeys`, `rsaImportKey`, key generation, password and key encoding, the key upload) resolving at any point.

A saga cancel (takeLatest on a new `ENCRYPTION.INIT`) stops the saga, but not the promise it was waiting on. The model keeps that promise running.

### Rules it checks

| Rule                   | Plain sentence                                                                                                                                                        | Harm when broken                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `noStaleClientStart`   | An init that started before a stop never leaves the Encryption client running for a session that has ended (its workspace is no longer the connected, signed-in one). | After logout or a switch the client runs again for the user who left: key distribution and decryption keep working against a session that ended, on another workspace's socket and database. |
| `logoutForgetsKeys`    | After logout removes a workspace's E2E keys, they stay off the device until someone signs in there again.                                                             | The logged-out user's private key (and, on the createKeys path, its random password) is written back to storage after logout.                                                                |
| `clientKeyMatchesUser` | A running Encryption client never holds another user's private key.                                                                                                   | The signed-in user's client decrypts with another workspace user's key, so their encrypted rooms fail to decrypt.                                                                            |
| `serverKeysStayOwn`    | A workspace's server only ever holds its own user's E2E keys.                                                                                                         | Keys generated for workspace A's user become workspace B's user's E2E keys; B's user is asked for an E2E password they never set, which was saved under A.                                   |

Why `noStaleClientStart` is scoped to an ended session: selecting the connected workspace again before the switch connects (`app/sagas/selectServer.ts:161` `sdk.host === server && token` → `SELECT_CANCEL` `:164`, no `abort()`) leaves the app on the same socket and session, after the switch's `encryptionStop`. An init that started before that stop can land after it on that path, but it starts the client for the user who is still signed in to the still connected workspace, with that workspace's own keys (`handleEncryptionInit` read `server` and `user` when it started, `encryption.js:37`–`:38`, and nothing between the stop and the cancel changes them). That is what a normal sign-in does, so it is not harmful. The rule flags the stale start once the switch connects (`switchConnects`) or logout ends the session (`logoutEndsSession`), which is when the harm starts. `check.sh --model` checks both directions: in a world where switches never connect, every rule holds with the scope and the unscoped rule flags the reselect path.

On `develop` nothing puts `encryptionInit` after that cancel, so unless such a stale init lands, the client stays stopped on the still signed-in workspace until the next login success. The pull request "fix: run post-login work once per login instead of a 2s window" (https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7928) restarts the post-login session on that path; when it lands, `reselectBeforeConnect` must start a new init for the connected user.

### Findings on develop

The code breaks all four rules. Shortest paths from `/statechart`:

1. `noStaleClientStart` (shortest path now goes through a switch; the logout path below is the one replayed):
   - B is signed in with stored keys, and its init waits on server info;
   - the user selects A: `encryptionStop`, and `connect()` has not run yet;
   - B's `e2eFetchMyKeys` succeeds on B's still open client;
   - `connect()` connects A; `rsaImportKey` is local, so `abort()` does not stop it;
   - `persistKeys` finishes and `initialize(B)` runs while A is connected.

   The logout variant: logout starts (`encryptionStop`) while init waits on server info; `e2eFetchMyKeys` succeeds, because logout is still awaiting cookies and the push token; `persistKeys` finishes and `initialize(B)` runs after the stop; the rule breaks when `sdk.logout` ends the session.

2. `logoutForgetsKeys`:
   - as path 1, but `removeServerKeys` runs before `persistKeys` (or `createKeys`) writes the keys;
   - the keys are written back. On the `createKeys` path the window is the whole key generation.
3. `serverKeysStayOwn`:
   - A's user has no keys, and A's init enters `createKeys`;
   - the user switches to B, whose user has no keys, and B signs in;
   - A's generation and encoding finish, and `e2eSetUserPublicAndPrivateKeys` posts A's keys on B's client.
4. `clientKeyMatchesUser`:
   - A's init is in `createKeys`;
   - the user switches to B, B signs in, and B's init imports B's keys and starts the client;
   - A's generation finishes and its unawaited `persistKeys` sets `this.privateKey` to A's key.

`check.sh --model` also checks a sketch of the fix. It drops the work of an ended session (an op whose start epoch is older than the current stop count) in `persistKeys`' write and before the upload. With that, every rule holds over 38,945 distinct states, and over 779,950 at four logins and three stops. A guard before `initialize` alone is not needed once both of those exist, because a stale op fails the saga first. Removing either guard brings its rules back.

Jest replays of these paths against the real saga and the real `Encryption` class are in `replays/encryptionInitRace.test.ts`. `check.sh` runs them in place with the repo's Jest (it needs `pnpm install`) and prints one line per test: `BROKEN-AS-RECORDED` while the test passes, because each test passes when it shows the bug, and `FIXED` when it fails, which means the code no longer takes the path or the harness no longer matches the code. They are the only part of the check that runs the real code, so they run on every change to covered code. All 5 pass at the sync point. None of them covers the switch variant of path 1:

- `path 1: initialize runs and encryptionSet(true) is put after ENCRYPTION.STOP`
- `path 2: persistKeys writes the private key back after logout removed it`
- `path 2 (createKeys): private key and random password are written after logout removed them`
- `path 3: A's generated keys are uploaded through workspace B's client`. The test gives B's user existing keys, so it shows the post reaching B's client. Only a B user with no keys has their keys replaced.
- `path 4: A's key import overwrites B's private key after B initialized`

The replays also found a bug outside the model: `encodePrivateKey` reads `store.getState().server.version` when it runs, so after a switch A's key is encoded for B's server version (v2 instead of v1, for example). The harness mocks `generatePassphrase`, because its dynamic `import('./wordList')` fails in Jest without VM modules.

### Reading a result

`check.sh` checks each of the four rules on its own. Read the paths with `/statechart`: run it on a copy of `model/encryptionInit.ts` in a fresh `mktemp -d`, and read every broken rule's path in its `report.md`.

Once the code is fixed, port the fix into the model in place of the sketch, so `encryptionInit.ts` passes on its own and `check.sh` prints `FIXED`. Then move the rules to the holding list in `check.sh`, and keep the sketch's mutants as mutants that each remove one guard.

### Bug or modeling error

Replay each path in `replays/encryptionInitRace.test.ts`. Hold each await open with a Deferred, dispatch `ENCRYPTION.STOP` and `ENCRYPTION.INIT` as the path says, and read `Encryption.userId`, `Encryption.privateKey`, the `UserPreferences` mock and which client `e2eSetUserPublicAndPrivateKeys` reached. A step the code cannot take is a modeling error. Examples: a REST request that survives a workspace switch (`connect()` aborts them), or an upload the server accepts for a user who already has keys (it answers `error-keys-already-set`). Fix the model and cite the code.

### Coverage (same sync point as the key distribution table)

| Model piece                                              | Code                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loginSucceeds`, `init`                                  | `app/sagas/login.js:335` `put(encryptionInit())` in `handleLoginSuccess` `:328`, forked by `root` `:500` → `app/sagas/encryption.js:148` `takeLatest(ENCRYPTION.INIT, handleEncryptionInit)` (`:35`)                                                                               |
| `serverInfoResolves`                                     | `encryption.js:46` `serversCollection.find(server)`, then `storedPrivateKey` read `:62` before `e2eFetchMyKeys` `:65`                                                                                                                                                              |
| `myKeysResolve`                                          | `encryption.js:65`–`:87`: password banner, `persistKeys` `:84`, or `createKeys` `:87`; `storedPublicKey` is read after the fetch                                                                                                                                                   |
| `keyImportResolves`                                      | `app/lib/encryption/encryption.ts:171` `persistKeys`: `this.privateKey = await rsaImportKey(...)`, then both `UserPreferences.setString`                                                                                                                                           |
| `keysGenerated`, `keyEncoded`, `keyUploadResolves`       | `encryption.ts:180` `createKeys`: generate and export, `this.persistKeys(...)` without await `:189`, `createRandomPassword`, `encodePrivateKey`, `e2eSetUserPublicAndPrivateKeys` `:198` on the current client; the server refuses `error-keys-already-set` when the user has keys |
| `finishInit`                                             | `encryption.js:100` `Encryption.initialize(user.id)`                                                                                                                                                                                                                               |
| `selectWorkspace`, `switchingTo`                         | `app/sagas/selectServer.ts:156` `handleSelectServer` under `takeLatest(SERVER.SELECT_REQUEST)` `:298`: `sdk.host` differs `:161`, so `encryptionStop` `:168`                                                                                                                       |
| `switchConnects`, `abortRequests`                        | `selectServer.ts:198` (or `:203`) `connect()` → `app/lib/services/connect.ts:63` `abort()` → `sdk.abort()` rejects every REST request in flight                                                                                                                                    |
| `reselectBeforeConnect`                                  | a new `SERVER.SELECT_REQUEST` for the connected workspace cancels the switch (takeLatest) before `connect()`; `selectServer.ts:161` `sdk.host === server && token` → `SELECT_CANCEL` `:164`, no abort and no `encryptionInit`; a running init saga keeps running                   |
| `logoutStarts`, `logoutEndsSession`, `logoutRemovesKeys` | `login.js:401` `encryptionStop`, then `app/lib/methods/logout.ts:119` `logout`: cookies, push token, `sdk.logout` `:145`, `disconnect` `:149`, `removeServerData` `:152` → `removeServerKeys` `:28`                                                                                |

Move the sync commit forward only after you have read the covered code at the new commit and confirmed the model still describes it.

### Scope and assumptions

Not covered:

- `handleEncryptionDecodeKey` (password entry), which has the same shape: it fetches keys, persists them, then calls `initialize` without checking for a stop.
- `waitForE2eEnable`, which already gives up on `LOGOUT` and `SERVER.SELECT_REQUEST`; the model assumes E2E is on.
- `e2eRequestSubscriptionKeys`, folded into the upload, and the random password write, which shares the import's window.
- Account deletion, which dispatches `encryptionStop` like logout. The model's logout stands in for it.
- How long each await takes. The model shows that an order is possible, not how likely it is. Key generation (RSA 2048) and encoding (PBKDF2 with 100,000 rounds on servers 7.13 and later) make the `createKeys` windows wide; the `rsaImportKey` window in paths 1 and 2 is short.
- Servers older than the `error-keys-already-set` check, where an upload can also overwrite a user's existing keys.
- A login success, logout or another select while a switch has not connected yet: `loginSucceeds` and `logoutStarts` wait for the switch to connect or be cancelled.
- A reselect of a connected workspace with no stored token. The `&& token` at `selectServer.ts:161` sends that select through `encryptionStop` and `connect()` again; the model cancels it like any reselect. That only happens before anyone signed in to the workspace, where the model's abort changes nothing (no fetch or upload can reach an unauthenticated client) and a second stop only clears a client whose stale start the rules already flagged.
- A `LOGIN.SUCCESS` within 2 seconds of the previous one. `root` (`login.js:499`–`:510`) is waiting on its cancel race, not on `take(LOGIN.SUCCESS)`, so it drops that action and no `encryptionInit` is put; the model always puts one.
- Which key a workspace's server and device hold, beyond whose user it belongs to. Two inits for the same user that both find no keys (a reconnect, or the session restart after a reselect, during `createKeys`) each generate a key pair; the server keeps the first upload and refuses the second, while either unawaited `persistKeys` can write last. The model cannot tell those keys apart, so it does not check that the device's key matches the server's.
