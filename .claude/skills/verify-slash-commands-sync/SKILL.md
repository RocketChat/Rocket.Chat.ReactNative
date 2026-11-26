---
name: verify-slash-commands-sync
description: Exhaustively checks how getSlashCommands in app/lib/methods/getSlashCommands.ts (its paging loop and saveSlashCommands) pages through GET commands.list and replaces the local slash_commands table, for every combination of command count, server page settings (API_Default_Count, API_Upper_Count_Limit, API_Allow_Infinite_Count, a server that ignores paging), failed requests, apps not loaded yet, commands added, inserted or removed while paging, pages served by a server instance that registered commands in another order, switching to another workspace while a request is in flight, and what the table held before. Use before merging any change to those functions, to the commands.list typing in app/definitions/rest/v1/commands.ts, or when slash commands are missing on mobile, a command posts as a plain message, an uninstalled app's command stays offered, the command list empties after a sign-in, or one workspace shows another workspace's commands.
metadata:
  covers:
    - app/lib/methods/getSlashCommands.ts
    - app/definitions/rest/v1/commands.ts
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 4fa4fc2af2882fe1dbb22fa84e7efb6cd10805e2
---

# Verify slash commands sync

The real `getSlashCommands` runs under Jest in every world of a bounded set. Only its edges are fakes: the server (`sdk.get('commands.list', …)`) and the local databases (`database.active` with the `slash_commands` collection, for the workspace the sync started on and for one other workspace). There is no hand-written model of the function, so only the fakes and the rules below can drift from the code.

The server fake copies the server's paging rules (`getPaginationItems` in the server's `apps/meteor/server/api/lib/getPaginationItems.ts` and the `commands.list` route in `apps/meteor/server/api/v1/commands.ts`):

- With no `count`, the server uses `API_Default_Count`.
- A `count` above `API_Upper_Count_Limit` is lowered to it.
- `count=0` returns every command when `API_Allow_Infinite_Count` is on, and a default-size page otherwise.
- `total` is counted before paging.
- Commands are sorted by the `sort` the client sends. With no `sort`, the server's default `{ name: 1 }` matches no field, so commands come in the order the instance registered them, which can differ between instances of one workspace.
- While apps are still loading, servers 8.1 and newer answer `{ commands: [], appsLoaded: false, offset: 0, count: 0, total: 0 }` with status 202. 8.1 to 8.3 send that body without a `success` field (`apps-not-loaded-without-success`); 8.4 and newer add `success: true` (`apps-not-loaded`). Servers 8.0 and older never answer 202 and send no `appsLoaded` field.

The app's client edges the fake stands for (`sdk.get` in `app/lib/services/sdk.ts` calls `@rocket.chat/sdk`'s `Client.request`):

- `getParams` sends `offset=0&count=0` as strings; the server's `parseInt(String(...))` reads them back as numbers, so the fake takes the numbers directly.
- `success` accepts any status that is not 4xx or 5xx, so a 202 resolves with its body like a 200; a 4xx or 5xx rejects (the `throws` failure).

The database fake applies each `db.batch` all at once, rejects two creates of the same id (like SQLite's primary key), and rejects a batch outside `db.write`.

A workspace switch copies `connect()` in `app/lib/services/connect.ts`: `database.setActiveDB(server)` then `sdk.initialize(server)`. While the chosen request is in flight, `database.active` starts returning the other workspace's database, and every later `commands.list` request is answered by the other workspace's server (one command, `other0`). The request in flight still gets the first server's answer.

## Worlds

| Input                               | Values                                                                                                                                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands on the server              | 0 to 7 (`SC_MAX_COMMANDS`)                                                                                                                                                                                                                |
| Server paging                       | Default 2 / Upper 2; Default 2 / Upper 4; Default 3 / Upper 5 with infinite count; Default 1 / Upper 3; Default 2 / Upper 4 with no `appsLoaded` field (server 8.0 or older); a server that ignores `offset`/`count` and sends no `total` |
| Failure                             | none; request 1, 2 or 3 rejects, answers `success: false`, or answers `appsLoaded: false` with or without `success: true` (not on the 8.0-or-older server, which can't send it)                                                           |
| List change after the first request | none; a command appended (`z-late`); a command inserted first (`a-early`); the first command removed; later requests served by an instance that registered the same commands in reverse order                                             |
| Local table before                  | empty; every server command with an old description; a command no longer on the server plus the first command with an old description                                                                                                     |
| Workspace switch                    | none; while request 1 is in flight; while request 2 is in flight                                                                                                                                                                          |

That is 25,920 runs, in a few seconds.

## Rules it checks

| Rule                                            | Plain sentence                                                                                                                                                                                                                                                                                                                                      | Harm when broken                                                                                                                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `completeSync`                                  | When no request fails and the set of commands doesn't change (another instance's registration order counts as no change), `slash_commands` ends holding exactly the server's commands, with the server's fields.                                                                                                                                    | Commands after the first page are missing: autocomplete omits them and `MessageComposer` sends `/command args` as a plain message. Or an uninstalled app's command stays offered. |
| `failureKeepsTable`                             | When any request fails (rejects, `success: false`, or `appsLoaded: false`), `slash_commands` is left exactly as it was.                                                                                                                                                                                                                             | One failed page, or a server whose apps are still loading, empties the user's command list until the next sign-in.                                                                |
| `terminates`                                    | `getSlashCommands` settles (resolves, or rejects with the request's error) after at most 60 requests and within 3 seconds.                                                                                                                                                                                                                          | The post-login fork `fetchSlashCommandsFork` (`app/sagas/login.js`) never ends and keeps hitting the server.                                                                      |
| `changingListKeepsOnlyServerCommands`           | When the list changes while paging, the table ends holding only commands that were on the server during the sync, each with the server's current fields, and the batch is not rejected.                                                                                                                                                             | Stale or duplicate commands, or a batch that fails and keeps the old table.                                                                                                       |
| `workspaceSwitchSavesOnlyIntoStartingWorkspace` | When `database.active` changes while a request is in flight, `getSlashCommands` sends no further request, leaves the other workspace's `slash_commands` untouched, and leaves the starting workspace's table either as it was or holding the starting server's commands (as `completeSync` or `changingListKeepsOnlyServerCommands` would require). | The other workspace's commands are saved into the starting workspace, or the starting workspace's commands into the one now open: each offers commands its server doesn't have.   |

The rules only apply when the failure, change or switch actually happened: a failure at request 3 in a run that made one request counts as a clean run. `completeSync` and `changingListKeepsOnlyServerCommands` skip runs with a switch; `workspaceSwitchSavesOnlyIntoStartingWorkspace` covers those.

## When to run it

Run it when the diff touches `getSlashCommands.ts`, the `commands.list` type in `app/definitions/rest/v1/commands.ts`, `protectedFunction`, or how `fetchSlashCommandsFork` calls it.

## Run

```sh
.claude/skills/verify-slash-commands-sync/check.sh
```

It runs `harness/slashCommands.verify.ts` once under Jest, with `harness/jest.config.js`. That config loads the checkout's own `jest.config.js`, so it checks the code in the checkout the skill sits in. Jest's cache and every log go to a fresh `mktemp -d`, printed on the first line. It takes about 10 s.

It prints one line per rule:

- `HOLDS <rule>`: no run broke it.
- `NEW-BREAK <rule> (<n> failing runs; …)`: the log holds the shortest failing run, plus the shortest one with commands on the server when that differs. A run reads: the world, the table before, each `commands.list` request with its `offset`/`count` and what the server answered, and the table after.
- `ERROR`: the harness did not finish; read the log.

The exit code is 0 only when every rule holds, 1 when a rule broke, 2 on a tool error.

After you edit the harness or this skill, also run:

```sh
.claude/skills/verify-slash-commands-sync/check.sh --model
```

It reruns the harness once per mutation in `harness/mutations.js`, in about a minute. `harness/mutatingTransformer.js` rewrites `getSlashCommands.ts` in memory only. Each mutation must print `CAUGHT` with the rules it broke.

- `MISSED` means no rule catches that break any more.
- `STALE` means the mutation's `from` text no longer exists in the code: point it at the new text of the same guard.

The mutations:

- stop after one page
- always ask for offset 0
- page without asking the server to sort by command
- save what was fetched when a later page fails
- trust an `appsLoaded: false` answer
- treat a missing `appsLoaded` as not loaded
- keep records the server no longer lists
- create a command twice when it arrives on two pages
- keep paging after the workspace changes (drops the `database.active !== db` check)
- save what was fetched when the workspace changes mid-sync
- save into `database.active` instead of the database the sync started on

## Telling a bug from a harness error

For each broken rule, take the shortest run and replay it against the real code: follow the paging loop in `getSlashCommands` request by request, then `saveSlashCommands`, with the answers the run shows.

- Every answer is one the server can give → bug. Report the steps, the harm from the rules table, and file:line.
- An answer the server can't give (check `commands.list` and `getPaginationItems` on the server versions the app supports) → harness error. Fix the fake in `harness/slashCommands.verify.ts`, not the rule.

Never weaken a rule to make the current code pass.

## Changing the verification

If a change is intended, update the rule or the fake that describes it in `harness/slashCommands.verify.ts`. For example, a server change to the `commands.list` answer, or the client keeping partial results on purpose. Then add or adjust a mutation in `harness/mutations.js` that breaks the new guard, and run both commands.

## Coverage

Sync commit: `4fa4fc2af2882fe1dbb22fa84e7efb6cd10805e2` (also `metadata.sync`). Line numbers are at that commit; find functions by name if lines moved. To list what changed since the harness last matched the code:

```sh
git diff 4fa4fc2af2882fe1dbb22fa84e7efb6cd10805e2 -- app/lib/methods/getSlashCommands.ts app/definitions/rest/v1/commands.ts
```

| Code                                                            | What the check covers                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/methods/getSlashCommands.ts:12-44` `saveSlashCommands` | one batch: create new, update listed, delete unlisted; one record per command name                                                                                                                                                                                                                                                                                                                                                                                |
| `app/lib/methods/getSlashCommands.ts:46-69` `getSlashCommands`  | paging by `offset`, `count=0`, sorted by command; stop on an empty page, a missing `total` or a reached `total`; `success: false` and `appsLoaded: false` give up; no further page and nothing saved once `database.active` is not the database the sync started on; reads `database.active` once and saves into that database; a rejected request writes nothing and the rejection reaches the caller (`fetchSlashCommandsFork` logs it); settles in every world |
| `app/definitions/rest/v1/commands.ts` `'commands.list'`         | only as the shape the server fake answers with                                                                                                                                                                                                                                                                                                                                                                                                                    |

Move the sync commit forward, here and in `metadata.sync`, only to a pushed commit, after you have read the covered code at that commit and confirmed the harness still describes it, or updated the harness and rerun. Then update the line numbers.

## Not covered

- `changingListKeepsOnlyServerCommands` does not require that a command which stayed on the server ends in the table. When a command before the current offset is removed (an app uninstalled) while paging, the next page skips one command that is still on the server, and the save deletes it until the next sign-in. The current code does this; the rule accepts it.
- The real WatermelonDB and SQLite: the fake applies a batch all at once and rejects duplicate ids; a SQLite failure mid-batch is not tried.
- What `sanitizedRaw` and `Object.assign` store for fields outside `description`, `params`, `appId`, `clientOnly`, `providesPreview`.
- More than 7 commands, other page sizes, a `total` that disagrees with the list the server pages, and changes after the second request.
- Calls that overlap in time (two sign-ins at once), and reloading when apps install or uninstall later: the app loads the list only at sign-in.
- How `MessageComposer` and the autocomplete read the table.
- A server 8.0 or older that answers while its apps are still loading: it sends only the core commands with no `appsLoaded`, which the client can't tell from a full list, so app commands are deleted until the next sign-in.
- `API_Default_Count` above `API_Upper_Count_Limit` (the server doesn't cap the default), and the server's fallbacks for settings at 0 or below (default 50, upper 100).
- A workspace switch after request 2, a switch during `saveSlashCommands` (the save still goes to the starting database, which is the intent), switching back to the starting workspace before the next page, and two switches in one sync.
