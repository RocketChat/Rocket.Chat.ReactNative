---
name: verify-workspace-selection
description: Model-checks how the app selects a workspace (handleSelectServer, startInsideUnlessSharing and handleServerRequest in app/sagas/selectServer.ts, getStoredSession in app/lib/methods/loggedInServer.ts) against everything that dispatches a select - boot (init.js restore), Add workspace and Connect, closing Add workspace (NewServerView), the workspace switcher (ServersList), sign-in, logout (login.js handleLogout) and the share extension (deepLinking.js handleShareExtension). Use before merging any change to those functions, to the sdk.host shortcut, to which root a select puts, or when Connect, a workspace switch or a share opens an empty rooms list, the wrong screen, or hangs on the loading screen.
metadata:
  covers:
    - app/sagas/selectServer.ts
    - app/lib/methods/loggedInServer.ts
    - app/lib/methods/migrateTokenKeysToServerScoped.ts
    - app/sagas/init.js
    - app/sagas/login.js
    - app/sagas/deepLinking.js
    - app/lib/services/connect.ts
    - app/lib/services/sdk.ts
    - app/lib/methods/logout.ts
    - app/reducers/server.ts
    - app/views/RoomsListView/components/ServersList.tsx
    - app/views/NewServerView/index.tsx
    - app/views/ShareListView/index.tsx
    - app/views/ShareView/index.tsx
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify workspace selection

A tla-ts model of `handleSelectServer` and the flows that dispatch it, checked for every order of events in a small world: two workspaces (A, the one in `CURRENT_SERVER`, and B, which starts without a login), A starting signed in, with a userId whose token the token migration dropped, or with nothing; selections that succeed, take the shortcut for the connected workspace, or fail; resume logins that succeed or fail; one logout at a time; and one share into the app per run.

## Rules it checks

| Rule                                            | Plain sentence                                                                                          | Harm when broken                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `liveWorkspaceOpensWithoutReconnect`            | Selecting the connected workspace that has a stored login opens its rooms list without reconnecting.    | Each tap on the current workspace drops and reopens the socket, and the rooms list reloads.              |
| `loginlessSelectEndsOnWorkspaceScreen`          | Selecting a workspace without a stored login ends on the workspace screen, connected to that workspace. | Retrying Connect on a new workspace opens an empty rooms list instead of the sign-in screen.             |
| `selectPendingNow` (`@leadsTo noSelectPending`) | Every workspace selection ends with success, cancel or failure.                                         | The app waits on a select that never ends, and every flow that waits for `SELECT_SUCCESS` waits with it. |
| `onLoadingRoot` (`@leadsTo offLoadingRoot`)     | The app never stays on the splash or a loading screen forever.                                          | The app sits on the splash or the share loading screen until it is killed.                               |

## When to run it

Run `check.sh` when the diff touches any function in the coverage table below. The table records the line numbers at `metadata.sync`; look the functions up by name if the lines moved.

## Run

From the repo root:

```sh
SKILL_DIR=.claude/skills/verify-workspace-selection .claude/skills/verify-workspace-selection/check.sh
```

It copies the model to a fresh `mktemp -d` and runs tla-ts once for every rule, with the deadlock check (a few seconds). It prints one line per rule and exits 0 only when every rule holds:

```
HOLDS liveWorkspaceOpensWithoutReconnect
HOLDS loginlessSelectEndsOnWorkspaceScreen
HOLDS selectPendingNow
HOLDS onLoadingRoot
```

`NEW-BREAK` means a rule breaks (or the model deadlocks): the change altered behavior, so follow "Bug or modeling error" below. `ERROR` means the model did not compile or the search stopped before it reached every state.

After editing the model, run `check.sh --model` (under a minute). It also runs everything `check.sh` runs, then breaks one guard per rule and expects that rule to break in more states (`CAUGHT`):

```
CAUGHT loginlessSelectEndsOnWorkspaceScreen (0 -> 2296 violating states)
CAUGHT liveWorkspaceOpensWithoutReconnect (0 -> 2839 violating states)
CAUGHT selectPendingNow (0 -> 1 violating states)
CAUGHT onLoadingRoot (0 -> 1 violating states)
```

The mutant runs pass `-deadlock`, so a mutant that stops the model still reaches the temporal checks. `MISSED` means a rule no longer catches the break it guards; `STALE` means the guard's text changed in the model, so update that mutation in `check.sh` to the new text of the same guard. The first mutation puts back the bug that "fix: show the workspace screen when retrying Connect to a workspace without a login" (https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7919) fixed: the shortcut `if (sdk.host === server)` without `&& token`.

Read the path to each broken rule with `/statechart`: run its command on a copy of `model/workspaceSelection.ts` in a fresh `mktemp -d`, and read its `report.md`. It gives each broken rule its shortest path and lists the rules that hold (9,035 states, a few seconds). The model has more states than the chart budget, so the chart only draws the bug paths.

tla-ts writes `WorkspaceSelection.tla`, `.cfg` and `_TTrace_*` files next to the model it runs. They are build output: never commit them.

## Bug or modeling error

For each broken rule, take the shortest path from `/statechart` and replay it against the real code, one action per step:

- Selection steps: `app/sagas/__tests__/selectServer.test.ts` (the `selecting the connected workspace` block) or `selectServer.sdkHost.test.ts`, which run the real saga on a recording store from `app/lib/testUtils/sagaStore.ts`.
- Paths through the share extension or logout: `app/sagas/__tests__/shareExtension.sameWorkspace.test.ts`, or a new Jest test that forks the deepLinking, init, selectServer and login sagas together on the same recording store and records each root with the user's token.

Then decide:

- The test reproduces the path: it is a bug in the code. Fix the code, not the model.
- A step can't happen in the code (the code makes two model steps atomic, a user tap lands where the UI blocks taps, a guard exists in the code but not in the model): it is a modeling error. Fix the model so the step matches the code, cite the code in the action's comment, and rerun.

Never weaken a rule to make it pass.

## Coverage (at `metadata.sync`)

| Model piece                                         | Code                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectServerChecks`                                | `app/sagas/selectServer.ts:156` `handleSelectServer`: `:159` `migrateTokenKeysToServerScoped`, `:160` `getStoredSession`, the shortcut `:161` (`sdk.host === server && token`: `applyBasicAuth`, `startInsideUnlessSharing`, `selectServerCancel`), the user branch `:195` (`setUser`, `connect({ logoutOnError: true })`, `startInsideUnlessSharing`, `CURRENT_SERVER`), the no-login branch `:202` (`clearUser`, `connect`, `ROOT_OUTSIDE` with no share guard) |
| `startInsideUnlessSharing`, `isSharing`             | `app/sagas/selectServer.ts:149`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `selectServerFinishes`, `selectServerFails`         | `app/sagas/selectServer.ts:226` `selectServerSuccess`; the catch `:227` (`ROOT_OUTSIDE` unless `ROOT_INSIDE` or `ROOT_SHARE_EXTENSION`); only `getLoggedUserById` `:173` can throw, because `applyServerCertificate` and the migration catch their errors                                                                                                                                                                                                         |
| `selectServerRequest`                               | `app/reducers/server.ts` `SERVER.SELECT_REQUEST`; `takeLatest` at `app/sagas/selectServer.ts:298`                                                                                                                                                                                                                                                                                                                                                                 |
| `storedA`, `storedB`, `hasToken`, `hasUserId`       | `app/lib/methods/loggedInServer.ts:6` `getStoredSession`, `:12` `isLoggedInServer`; `app/lib/methods/migrateTokenKeysToServerScoped.ts:41` drops the token of a userId two workspaces share                                                                                                                                                                                                                                                                       |
| `connect`, `sdkHost`, `abortedLoginFails`           | `app/lib/services/connect.ts:60` `connect` (`abort()` `:63`, `sdk.initialize` `:88`, `loginRequest({ resume })` on `connected`); `app/lib/services/sdk.ts` `host`, `disconnect` sets it to null; `app/sagas/login.js:172` the aborted login puts `LOGIN.FAILURE`                                                                                                                                                                                                  |
| `initRestores`                                      | `app/sagas/init.js:74` `restore`, `:29` `restoreServer`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `userTapsAddWorkspace`, `userSwitchesWorkspace`     | `app/views/RoomsListView/components/ServersList.tsx:62` `navToNewServer`, `:77` `select` (`:98` dispatch)                                                                                                                                                                                                                                                                                                                                                         |
| `userTapsConnect`                                   | `app/sagas/selectServer.ts:250` `handleServerRequest` (`:286` dispatch); the Connect button is disabled while `state.server.connecting` (`app/views/NewServerView/index.tsx:185`)                                                                                                                                                                                                                                                                                 |
| `userClosesAddWorkspace`                            | `app/views/NewServerView/index.tsx:89` `close` (`:94` dispatch)                                                                                                                                                                                                                                                                                                                                                                                                   |
| `userSignsIn`, `serverAnswersLogin`                 | `app/sagas/login.js:104` `handleLoginRequest`; `:384`-`:388` `handleLoginSuccess` stores the session under `state.server.server`, sets `CURRENT_SERVER`, `startInsideUnlessSharing`                                                                                                                                                                                                                                                                               |
| `userLogsOut`, `logoutFinishes`                     | `app/sagas/login.js:400` `handleLogout`, `:406` `logoutCall` → `app/lib/methods/logout.ts:119` `logout` (disconnect, `removeServerData`, `removeCurrentServer`), `:423` selects `findLoggedInServer`, else `ROOT_OUTSIDE`                                                                                                                                                                                                                                         |
| `userSharesIntoApp`, `shareUnlocks`, `shareGivesUp` | `app/sagas/deepLinking.js:213` `handleShareExtension`: `:215` userId check, `:222` `ROOT_LOADING_SHARE_EXTENSION`, `:241` select, `:242` skips the wait when `sdk.host === server`, `:243` race on `LOGIN.SUCCESS`, `LOGIN.FAILURE`, `SELECT_FAILURE`, `LOGOUT`, `:255` `ROOT_SHARE_EXTENSION`                                                                                                                                                                    |
| `userLeavesShare`                                   | `app/views/ShareListView/index.tsx:392`, `app/views/ShareView/index.tsx:309` put `ROOT_INSIDE`                                                                                                                                                                                                                                                                                                                                                                    |

Move the sync commit forward only after you have read the covered code at the new commit and confirmed the model still describes it (or updated the model and rerun). Then update the line numbers in this table.

## Scope and assumptions

Covered: every order of the events above for two workspaces, including the bug that "fix: show the workspace screen when retrying Connect to a workspace without a login" (https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7919) fixed (Add workspace, Connect to a workspace without a login, Back, Connect again), selects that replace a pending one (the share extension, logout), and the share extension racing a pending select or a logout.

Not covered:

- Timing the model assumes: the user can't tap while a select is pending, `init.js` restore or the share unlock runs, or an aborted login has its `LOGIN.FAILURE` left to put. A saga step that awaits no network ends before a tap could land.
- A resume login that lands after another workspace was selected (`handleLoginSuccess` stores it under `state.server.server`): the model only lets a login answer for the selected workspace. See `/verify-post-login-session`.
- `localAuthenticate` always succeeds; the share unlock cancel is covered by Jest tests in `app/sagas/__tests__/shareExtension.sameWorkspace.test.ts`; the restore unlock cancel is not modeled.
- A forced logout (`forcedByServer`), account deletion (`login.js:469` `handleDeleteAccount`), the set-username root, OAuth, SAML, deep links and pushes (see `/verify-deep-link-readiness`).
- A share that arrives on a cold start, more than one share per run, and more than two workspaces.
- Server records: the switcher and the close button may pick a workspace whose record logout removed; the model lets them, and that select takes the no-login branch.
- What the screens show inside a root (WorkspaceView or NewServerView in `ROOT_OUTSIDE`), basic auth, certificates and the supported-versions check.
- The model assumes a pending login always answers (`serverAnswersLogin` is fair). If the server never answers, the share extension's race at `deepLinking.js:243` has no timeout and keeps `ROOT_LOADING_SHARE_EXTENSION`.
