---
name: verify-login-fetch-ordering
description: Check that the login and workspace-start fetches (permissions, enterprise modules, VoIP recheck, settings.public pagination) end in the same state whether they run in sequence or in parallel. Use when a change touches handleLoginSuccess or startVoipFork in app/sagas/login.js, getPermissions/setPermissions, getEnterpriseModules/setEnterpriseModules, checkVoipPermission, or getSettings in app/lib/methods/getSettings.ts, or when someone reorders, parallelizes or adds awaits to those calls.
metadata:
  covers:
    - app/sagas/login.js
    - app/lib/methods/getPermissions.ts
    - app/lib/methods/enterpriseModules.ts
    - app/lib/methods/helpers/hasPermission.ts
    - app/lib/services/voip/MediaSessionInstance.ts
    - app/sagas/selectServer.ts
    - app/lib/methods/getSettings.ts
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify login fetch ordering

Two checks guard the calls that run when a user logs in to a workspace. "perf: run independent startup, login and room calls in parallel" (https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7910) moved these calls from one-after-the-other to parallel. The checks compare the two.

1. **Model check (TLA+, checked with tla-ts).** `model/LoginFetchOrdering.tla` is a small model of `handleLoginSuccess`, `startVoipFork` and the two fetches it waits on. The model tries every order of their I/O completions, a workspace switch at any point, and every combination of starting and server values. It checks one rule and one comparison:
   - **VoipSessionMatchesAccess**: once login settles, with the licence lookup answering, the VoIP media session exists exactly when the user has a voice-call permission and the workspace licence has `teams-voip`. Harm if broken: calls can't be placed or received after login, or a session runs for a user who isn't allowed calls.
   - **Outcome comparison**: the set of settled outcomes in `Mode = "parallel"` equals the set in `Mode = "sequential"`. An outcome is the starting redux values, the server's answers, and the final permissions, modules, module owner, VoIP session and switch flag. Equal sets mean running the two fetches in parallel ends nowhere the sequential code couldn't. This is the regression check.
2. **Generated-input test (Jest, the real code).** `harness/getSettings.pagination.verify.ts` runs the real `getSettings` against a fake `settings.public` server: 9 fixed and 400 seeded random (setting count 0..250, page size 1..120) cases. It compares the result with the old sequential page loop, kept in the test as the oracle. The rule: when every page except the last has exactly the page size, the parallel fetch saves the same settings in the same order, with exactly ceil(N / page size) requests (at least 1). Harm if broken: workspace settings silently missing after login. Its named cases also record how old and new differ when a server breaks that contract. `harness/jest.config.js` reuses the repo's Jest config and only collects tests from `harness/`.

## Does my change touch this?

Yes if the diff touches any covered function below, or changes what it awaits, dispatches, or reads from redux. Run `git diff <sync>..HEAD -- <file>` for each file and read the hunks in the listed functions.

| File                                          | Functions                                                                                                                                                                                                                                                        | Covered by                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| app/sagas/login.js                            | `handleLoginSuccess` (spawn of startVoipFork, the `all([call(fetchPermissions), call(fetchEnterpriseModules)])`), `fetchPermissions`, `fetchEnterpriseModules`, `startVoipFork`, `checkVoipPermission`, `root` (2s race that cancels on `SERVER.SELECT_REQUEST`) | model                                 |
| app/lib/methods/getPermissions.ts             | `getPermissions` (DB read, `permissions.listAll`, `updatePermissions`, `setPermissions()` fired without await), `setPermissions`                                                                                                                                 | model                                 |
| app/lib/methods/enterpriseModules.ts          | `getEnterpriseModules`, `fetchLicenseState`, `setEnterpriseModules`, `isVoipModuleAvailable`                                                                                                                                                                     | model                                 |
| app/lib/methods/helpers/hasPermission.ts      | `hasPermission` (no await when called without `rid`)                                                                                                                                                                                                             | model (`AtomicCheck`)                 |
| app/lib/services/voip/MediaSessionInstance.ts | `init` (sets `this.instance` before its first await), `reset`                                                                                                                                                                                                    | model (`Decide`)                      |
| app/sagas/selectServer.ts                     | `handleSelectServer` (calls `setEnterpriseModules()`)                                                                                                                                                                                                            | model (`NewWorkspaceModulesDispatch`) |
| app/lib/methods/getSettings.ts                | `getSettings`                                                                                                                                                                                                                                                    | Jest harness                          |

The `sync` commit in the frontmatter is the origin/develop commit where the model and the harness were last confirmed to describe the code above.

## Run

From the repo root:

```sh
SKILL_DIR=.claude/skills/verify-login-fetch-ordering .claude/skills/verify-login-fetch-ordering/check.sh          # every change to covered code
SKILL_DIR=.claude/skills/verify-login-fetch-ordering .claude/skills/verify-login-fetch-ordering/check.sh --model  # changes to this skill: adds the mutants
```

The model runs through `pnpm dlx tla-ts@0.0.10` (a TLC-compatible model checker for Node); `model/check.mjs` uses its JS API. All output, traces and the Jest cache go to a fresh `mktemp -d`, printed on the first line.

Each result is one line:

- `HOLDS <mode> <rule>`, `HOLDS outcome-comparison ...`, `HOLDS getSettings-pagination ...`: the rule holds.
- `NEW-BREAK ...`: a rule broke, the outcome sets differ, or the Jest harness failed. The shortest path or the differing outcomes follow, indented.
- `CAUGHT` / `MISSED` / `STALE mutant ...` (`--model` only): a mutant made the rule break / did not / no longer matches the model text.
- `ERROR ...`: the checker or Jest could not run.
- `SKIPPED outcome-comparison ...`: a rule broke or errored above, so the comparison did not run; that line sets the exit code.

Exit 0 means every rule holds (and with `--model`, every mutant is `CAUGHT`). 1 means a rule broke, or a mutant was `MISSED` or `STALE`. 2 means a tool error.

To see why a rule broke, or to get a chart of the flow, read the trace with the `/statechart` skill.

## How the model maps to the code

One model step is one JS task: the work between two I/O completions (a REST or DDP reply, a WatermelonDB read or write), including its microtasks. The model's action names match the code steps:

- `SpawnVoipAndStartFetches`: `yield spawn(startVoipFork)` and the start of the two fetches. Sequential mode starts only `getPermissions`. Parallel mode starts both.
- `PermsDbRead`, `PermsNet`, `PermsDbWrite`: the three awaits in `getPermissions`. `PermsDbWrite` resolves the promise and fires `setPermissions()` without waiting for it, only when permissions changed.
- `SetPermissionsDispatch`: `setPermissions` query completes, then `PERMISSIONS.SET`.
- `ModsNet`: `fetchLicenseState` answers. If it returns nothing, `clearEnterpriseModules()` dispatches `ENTERPRISE_MODULES.CLEAR`, which `startVoipFork` does not watch.
- `ModsDbFind`, `ModsDbWriteDispatch`: the server-record find and write, then `ENTERPRISE_MODULES.SET`.
- `Recheck`: `takeLatest([PERMISSIONS.SET, PERMISSIONS.UPDATE, ENTERPRISE_MODULES.SET], checkVoipPermission)`.
- `SequentialPermsReturn` and `SagaContinues`: the saga moving past its `call`/`all`.
- `SwitchWorkspace`: `root()` cancels `handleLoginSuccess` on `SERVER.SELECT_REQUEST` inside its 2s race, and `startVoipFork`'s race stops. Promises already started keep running. Saga steps not yet started never run.
- `NewWorkspaceModulesDispatch`: the new workspace's `setEnterpriseModules()` in `handleSelectServer`.
- `Decide(p, m) == p /\ m`: `canUseVoip`. `init()` when true, `reset()` when false.

`AtomicCheck = TRUE` (the default) says `checkVoipPermission` has no I/O await: `hasPermission` is called without `rid`, so it never touches the DB. Each check then runs inside the task that dispatched the action that triggered it. With `AtomicCheck = FALSE` the model lets checks finish in any order, and a cancelled `takeLatest` check still finishes, because cancelling a saga does not stop the async function it called. `check.sh --model` runs that shape as the mutant `checkVoipPermission-awaits-io`, and `VoipSessionMatchesAccess` breaks: the initial check reads permissions before `PERMISSIONS.SET`, and finishes after it, while `takeLatest` is not yet listening. If the code gains that await, run `ATOMIC_CHECK=FALSE check.sh` and report the break as a finding.

## Scope and assumptions

- Covered: every order of the I/O completions listed above, with one login and at most one workspace switch. All 64 combinations of starting permissions, starting modules, starting session, server permissions, server modules, and whether the licence lookup answers.
- Assumed: no active VoIP call during login (`reset()` is skipped during an active call, and the model ignores that). The redux permissions at login equal the DB permissions, as `selectServer`'s `setPermissions()` leaves them. Permissions are one boolean, "some voice-call permission is granted to the user's roles". `getPermissions` never rejects (it resolves on every path), and `fetchEnterpriseModules` catches its errors, so `all` never cancels a sibling. A workspace switch arrives within the 2s race in `root()`; later switches do not cancel `handleLoginSuccess` and are not modelled.
- Not covered: `PERMISSIONS.UPDATE` from the stream, a second `LOGIN.SUCCESS`, `inquiryRequest`, everything after the `all` in `handleLoginSuccess`, how long anything takes. The other calls the same PR parallelized are also out: `Root.init` in app/index.tsx, `removeNotificationsAndBadge` and `initializePushNotifications`, `probeServer` in selectServer.ts, `Encryption.getSample`, `EncryptionRoom.encryptKeyForOtherParticipants`, and `RoomActionsView.componentDidMount`.
- The Jest harness assumes the server contract that every page except the last is full. The named cases show what changes when that fails.

## What the Jest harness records when a server breaks the contract

The named cases pass and record these differences: a middle page shorter than the page size makes the parallel `getSettings` skip settings that the old loop fetched. An empty first page with `total > 0` makes it save an empty list where the old loop never stopped. A failing later page makes it send every page request before giving up, where the old loop stopped at that page.

## Reading a failure: real bug or model error?

1. Read the shortest path. Map each step to the code using the action list above. If a step can't happen in the code (for example a dispatch the code never makes), the model is wrong. Fix the model to match the code, never the rule.
2. If every step matches the code, it's a real bug. Report it as the numbered steps in the code's words, with the rule's one-line harm. Don't weaken the rule or the expectation to make it pass.
3. `only parallel` outcomes mean the parallel code ends somewhere the sequential code couldn't. Treat that as a regression unless it's the intended change. Then say so in the PR and explain why the new outcome is correct.
4. A Jest failure prints `seed=… case=… settingCount=… pageSize=…` in `jest.log`. Rerun it with `SETTINGS_PAGINATION_SEED=<seed>`.

## Updating the verification after an intended change

1. For each changed function in the coverage table, change the matching model action (or the oracle and cases in the Jest harness) so it does what the code now does. Keep the action names, and keep each action one JS task.
2. If you add an await on I/O inside `checkVoipPermission`, or pass a `rid` to `hasPermission` there, run with `ATOMIC_CHECK=FALSE`. If that becomes the code's normal shape, make it the default in `model/check.mjs` and drop the `checkVoipPermission-awaits-io` mutant.
3. Rerun. A rule that broke because of the change is a finding to report, not something to fix in the model. This skill carries only rules the code satisfies: a bug the code already has goes into a GitHub issue that carries its rule, and the PR that fixes the bug adds the rule back to `rules` in `model/check.mjs`.
4. Run `check.sh --model` and confirm every mutant prints `CAUGHT`. A `STALE` mutant means the model text it edits changed; update its `original` in `model/check.mjs`.
5. Only after the model and the harness describe the code at a commit on origin/develop, set `sync` in the frontmatter to that commit.

The outcome comparison depends on `getPermissions` firing `setPermissions()` without awaiting it. With that await in place, sequential mode always dispatches `PERMISSIONS.SET` before the licence fetch starts, so parallel mode gains outcomes the sequential code can't reach. If someone adds that await, rerun and decide whether the new parallel outcomes are acceptable.

For bringing this verification back in line after changes that didn't rerun it, use `/maintain-formal-verification-skill`.
