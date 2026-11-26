---
name: verify-native-accept-gate
description: 'Model-check the VoIP native accept gate (CallKit / Android Telecom accept → recoverSocket → media-signal/media-calls subscription wait → answer or end) with tla-ts. Use when a change touches acceptNativeCall.ts, socketHealth.ts, waitForLoginReady.ts, the connect/login flow, or bumps @rocket.chat/sdk; or when a native accept fails, ends after ~8s, or answers on a dead socket.'
metadata:
  covers:
    - app/lib/services/voip/acceptNativeCall.ts
    - app/lib/services/socketHealth.ts
    - app/lib/services/waitForLoginReady.ts
    - app/lib/services/connect.ts
    - app/reducers/connect.ts
    - app/reducers/login.ts
    - app/sagas/login.js
    - app/sagas/deepLinking.js
    - app/views/SetUsernameView.tsx
    - package.json
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify the native accept gate

A model of what happens between the user tapping Accept in the native call UI and the app answering or ending the call. It covers the app's accept gate, the SDK's DDP subscription bookkeeping, the socket reconnect and resume login, and the two server types: monolith (Meteor ddp-server) and microservices (ddp-streamer). The model is TypeScript ([native-accept-gate.ts](native-accept-gate.ts)). tla-ts compiles it to TLA+ and its checker tries every order of those steps in ten scenarios. For each property, it reports whether it holds or breaks, with the shortest path to the break.

This skill models the gate's readiness waits against the SDK and the server. `verify-voip-accept` owns the layer above it: what the app does with the call around the gate (`answerCall`, `endCall`, `nativeAcceptedCallId`, the user ending the call from the system UI).

## Properties

Each property has a plain sentence and the harm when it breaks. Each is an exported boolean function at the bottom of the model.

| Invariant                 | Holds when                                                                                                                                                       | Harm when broken                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `AcceptConnects`          | A native accept never ends the call while the server answers every request in time.                                                                              | The user taps Accept and the call ends about 8s later.                                                                               |
| `AnswerOnlyWhenLive`      | The app answers only while the socket is open, logged in, and both media subscriptions are active on the server for that connection.                             | The call is answered, but media signals for it are never delivered, so it never connects.                                            |
| `GateSendsNoDuplicateSub` | The accept gate never sends a `sub` whose id is already active on the connection.                                                                                | Monolith ignores it (no `ready`, so the gate times out). ddp-streamer runs the publication a second time (signals may arrive twice). |
| `MediaSubsSurviveAccept`  | Once everything settles, both media subscriptions are still in the SDK's `records` and active on the server.                                                     | Later calls never ring in the app until it reconnects to the server from scratch.                                                    |
| `AnswerBeforeDeadline`    | The app never answers because the 8s gate deadline passed: it answers only on a positive result from both waits.                                                 | The user waits 8s after tapping Accept, or the app answers without having confirmed the subscriptions.                               |
| `NeverAnswers`            | A witness, expected to **break**: a break proves that some path answers the call. When it holds, the scenario can never answer. Runs in `check.sh --model` only. | —                                                                                                                                    |

Scenarios (`check.sh`): `{monolith, streamer}` × `{alive, reopen, drop, late, relogin}`. `alive`: the probe confirms the socket is alive and the media subscriptions are already active. `reopen`: the probe fails and `recoverSocket` forces a reopen. `drop`: the socket is alive, and the transport is lost once while the gate waits. `late`: the socket is alive, but media-signal's `sub` already ran out the SDK's 10s deadline, and its `ready` is still on the way. `relogin`: the socket is alive and logged in, both media `sub`s go out for the first time, and the app may log in once more on the same socket (deep-link login, `SetUsernameView`, `connect.ts:413`). On monolith that login re-sends `ready` for every active sub in one frame.

## Does this change touch the verified code?

Run from the repo root, with `<sync>` the `metadata.sync` commit above:

```sh
git diff <sync> -- app/lib/services/voip/acceptNativeCall.ts app/lib/services/socketHealth.ts \
  app/lib/services/waitForLoginReady.ts app/lib/services/connect.ts \
  app/reducers/connect.ts app/reducers/login.ts app/sagas/login.js \
  app/sagas/deepLinking.js app/views/SetUsernameView.tsx | head -50
git diff <sync> -- package.json | grep '@rocket.chat/sdk'
```

Also run both with no commit, to see uncommitted changes, and `git status --short -- app/lib/services` for new files that the gate may now import. Any hunk in those files that changes a step listed in [model-map.md](model-map.md), or any change to the `@rocket.chat/sdk` pin, means the model may no longer describe the code.

**Coverage record.** Last confirmed in sync at app commit `427648b7346c229a5b1ada3a0a596ff7c1af0842`, with `@rocket.chat/sdk` pinned at `59708d7b48aace43ef65b16de101fc12a96b69aa` (read under `node_modules/@rocket.chat/sdk/lib`). The gate as modeled landed in "fix: answer native calls on monolith servers by waiting for media subs acked on the current socket" (https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7913). [model-map.md](model-map.md) lists the files and functions each model action stands for.

## Run

From the repo root:

```sh
.claude/skills/verify-native-accept-gate/check.sh           # check
.claude/skills/verify-native-accept-gate/check.sh --model   # check-model
```

Both use `pnpm dlx tla-ts@0.0.10`; Java is not needed. `check` takes about 10 seconds: per scenario, one checker run for every invariant [expected.txt](expected.txt) records as holding, and one run for each invariant it records as breaking, except the witness. When a run of the holding invariants fails, it reruns that scenario one invariant at a time, so each broken invariant gets its own line. `check-model` takes about 20 seconds and adds the `NeverAnswers` witness in every scenario and the mutants below.

Each line is one result:

- `HOLDS <scenario> <invariant>`: holds, as recorded.
- `BROKEN-AS-RECORDED <scenario> <invariant>: <path>`: breaks, as recorded, with the shortest path as model actions.
- `NEW-BREAK <scenario> <invariant>: <path>`: breaks, but is recorded as holding.
- `FIXED <scenario> <invariant>`: holds, but is recorded as breaking. For `NeverAnswers` it means that scenario can no longer answer.
- `CAUGHT <mutant>` / `MISSED <mutant>`: the mutant does or does not break its invariant in every scenario it targets.
- `STALE <mutant>`: the mutant's edit no longer applies to the model; update its pattern in `check.sh`.
- `ERROR ...`: the model did not compile or the checker failed. The line names the `.out` file; a `TlaTypeScriptError` there gives the line in the model that tla-ts cannot compile.

The last line names the results folder, a fresh `mktemp -d`. It holds one folder per scenario with its `scenario.ts`, a copy of the model and its view, and each run's checker output (`<invariant>.out`, or `holding.out` for the combined run). Exit 0: every line is `HOLDS`, `BROKEN-AS-RECORDED` or `CAUGHT`. Exit 1: some result changed. Exit 2: an `ERROR`.

To check a model variant without touching the committed one, pass its path: `check.sh [--model] path/to/native-accept-gate.ts`, with the variant in a fresh `mktemp -d`. Keep the file name, because the variant is copied into each scenario folder under that name.

## Read every result with `/statechart`

Read each result with the `/statechart` skill. Point it at `native-accept-gate.ts` inside a scenario's folder in the results; that folder holds the scenario and the view ([native-accept-gate.view.ts](native-accept-gate.view.ts)), which labels states and steps in the code's words. For each broken invariant it gives the shortest path as a numbered list of steps. For a passing scenario it draws a chart of how the gate moves between states. Write each counterexample up as that numbered list, and use [model-map.md](model-map.md) to name the code behind each step. If `/statechart` is not available to you, say so and read the path from the `.out` file.

## A changed result: real bug or modeling error?

Walk the path step by step against the code at HEAD, using [model-map.md](model-map.md):

1. For each action in the path, open the code it stands for. Confirm that the step can happen there, with the same guard.
2. Confirm the order is possible. The model treats microtasks as atomic: after a frame or event, pending promise continuations run before any other step. Network frames on one connection stay in order (FIFO).
3. If every step and order holds in the code, it is a **real bug**. Report it with the path in code terms. Never weaken an invariant, or the model, to make it pass. Change product code only when the user asks.
4. If a step cannot happen in the code, it is a **modeling error**. Fix the action to match the code, cite the code in model-map.md, and rerun.

A result that changes from `breaks` to `holds` needs the same walk. Confirm that the code change really closes that path. Then confirm that the gain does not come from answering more readily: `NeverAnswers` still breaks in `check.sh --model`, and no `AnswerOnlyWhenLive` or `AnswerBeforeDeadline` row has newly broken. A gate that never fails meets `AcceptConnects` trivially, and the break moves to those two.

## When a change to covered code is intended

To judge a change that is not decided yet, mirror it in a copy of the model in a fresh `mktemp -d` (`check.sh path/to/native-accept-gate.ts`) and stop after step 2. Edit the committed files only for a change that will land.

1. Mirror the change in the matching action(s) of `native-accept-gate.ts`, keeping one exported action per indivisible step of the code. Update [model-map.md](model-map.md), and the view's `step` labels when you add or rename an action. Only `AcceptDecides` holds the answer-or-fail condition. `GateDeadline` only times out the waits that are still pending.
2. Run `check.sh` and read every changed row as above.
3. Once each changed row is explained and intended, change its verdict in [expected.txt](expected.txt), and run `check.sh --model`.
4. Move `metadata.sync` (and the SDK commit in the coverage record) forward, but only to a commit on `develop` and only after you have confirmed that the model describes the code at that commit.

## Expected results at the sync commit

Every property holds in every scenario, and `NeverAnswers` breaks everywhere, so each scenario can answer. The SDK's `waitForNotifyUserMediaSubs` sends nothing: it resolves `true` once both media subscriptions have a `ready` that arrived on the attached Transport ([NATIVE-1925](https://rocketchat.atlassian.net/browse/NATIVE-1925)). After a reopen, the `ready`s come from the `subscribeAll` that follows the resume login. A `ready` that lands after its `sub` expired still counts, if a record exists and the Transport is still attached.

What each `breaks` row would mean in code terms, if one appears:

- `AcceptConnects` on monolith with an alive socket: something sends a `sub` for an active id again, Meteor ignores it, and the 8s deadline ends the call.
- `AcceptConnects` or `MediaSubsSurviveAccept` after a reopen or a drop: a `sub` reaches the server before the resume login. The server answers `nosub` / `not-allowed`, the SDK forgets the record, and later calls stop ringing.
- `AnswerOnlyWhenLive` after a reopen: the wait counts a `ready` from a previous connection. The mutant `readyFromAnyConnection` in `check.sh --model` makes `canMediaSubsWaitSettle` accept any non-zero `readyOnGen` instead of `gen`: both reopen scenarios break.
- `GateSendsNoDuplicateSub`: the gate sends a `sub` again. This is the SDK at pin `ecf4fedcf8ab6121e62a6b95bb48823afd805afd` (`resubscribeWhenRecorded`), before the gate stopped sending `sub`s. To see it, in a copy of the model in a fresh `mktemp -d`, add a non-microtask action that, once the gate waits with both records and the link open, queues a `"gate"` `sub` for both, and make the wait resolve from those two `sub`s (ready or abandoned → ok, `nosub` → fail) instead of `readyOnGen`. Keep `quiet()` false until that action has run. Every scenario then breaks `GateSendsNoDuplicateSub`; `monolith-alive` and `monolith-late` also break `AcceptConnects` through the deadline, and the reopen and drop scenarios break `MediaSubsSurviveAccept`. The app test `answers on a live socket whose media subs were acked, without sending a sub` in `app/lib/services/voip/acceptNativeCall.sdk.integration.test.ts` replays the `monolith-alive` path.
- `AcceptConnects` in `monolith-relogin`: a `ready` frame acks two subs, and the SDK resolves only the first, as it did before SDK commit `5ef77711ddc270a0faa0f6d01da8b72dbec1caae` (`socket.ts` emitted `ready` under `subs[0]`). The second, sent for the first time, gets no record, so the `ready` listener skips it. It expires after 10s and is never ready on this socket. Even with that routing it cannot happen with the real servers. Meteor runs one message at a time per connection. Rocket.Chat's streamer publish never calls `this.unblock()`, and a login can't unblock before `setUserId`. So every new `sub` sends its own `ready` before a later login re-sends them in one frame. ddp-streamer sends one id per `ready`. To see it, let the server run the login while a `sub` is still starting, in a copy of the model in a fresh `mktemp -d`: split `ServerHandlesSub` into a start step and a ready step, and have `ServerHandlesLogin` re-send the starting subs in its one frame without their own `ready`. `monolith-relogin` then breaks `AcceptConnects`. At the sync commit `ReceiveReady` settles an in-flight `also` as it does `sub`, so that variant holds. To see the old routing break it, also drop the `also` settle from `ReceiveReady`.
- `AcceptConnects` in a `late` scenario: the SDK drops a `ready` that lands after its `sub` expired, so on a live socket every accept runs out the 8s deadline until the next reopen. The mutant `readyOnlyForInFlightSub` in `check.sh --model` makes `ReceiveReady` set `readyOnGen` only for an in-flight `sub`: both `late` scenarios break.

## Scope and assumptions

- Covered: one accept, the two media subscriptions, one server type per scenario, at most one transport loss, at most one extra login on a live socket (`relogin`). A `ready` frame carries one or two ids. Each scenario has under 1,000 distinct states, so the check is exhaustive within these bounds.
- The server is healthy: it answers every request, and a reconnect plus login completes before the 8s gate deadline. The `late` scenarios are the one exception: they start after a slow server let a `sub` expire. The deadline fires only when nothing else can move. So `AcceptConnects` failures happen on a healthy server, not on a slow one.
- The SDK's 10s request deadline (`ExpiredWait`) fires for any `sub` with no answer still on the way. On a healthy server, that is a `sub` the server ignored or one whose `ready` the SDK did not route to it. An expired `sub` keeps its record but is not ready until a `ready` for it lands. The `late` scenarios start just after one already expired.
- A transport loss is one atomic step. In the code, `waitForStreamsReady` compares `readyOn` with the attached Transport but not its `readyState`, so a socket that died before its `close` event fires still counts as ready. Neither the model nor the SDK can tell that case apart; `recoverSocket`'s probe is what guards it.
- In a variant, read a `Map` with `get(key)!`: without the `!`, tla-ts compiles the read to an unassigned `Undefined` constant, and every row reports `error`.
- The server keeps an acknowledged subscription for the life of the connection. An unsolicited `nosub` that ends one is not modeled, and the SDK would not notice it either.
- Not covered: `applyRestStateSignals` and `answerCall` after the decision (so a break of `AnswerOnlyWhenLive` cannot say whether the REST state signals make up for part of the loss), a second accept for the same call (the `activeGates` abort), logout (`close()` and `closesTaken`), other stream subscriptions, the ordering of messages inside the server beyond FIFO, and whether ddp-streamer delivers duplicated signals.
- Server behavior is an assumption read from Rocket.Chat source. Meteor ddp-server ignores a `sub` with an active id (`livedata_server.js`, `_namedSubs.has(msg.id)`). ddp-streamer (`packages/ddp-server/src/Server.ts` `subscribe`, `Publication.ts` `ready`) runs it again and answers `ready` with that one id, from a per-client serialized queue, and its `login` (`ee/apps/ddp-streamer/src/methods/accounts.ts`) does not touch subscriptions. Meteor's `_setUserId` re-runs every named sub on a login and sends their `ready`s in one frame (`_pendingReady`); a `sub` blocks the queue until its publish calls `ready()`, since `streamer.module.ts` `_publish` never calls `this.unblock()`. Both answer `nosub` with `not-allowed` before login (`packages/streamer/src/streamer.module.ts` `_publish`, and the `streamUser.allowRead` rule in `packages/streamer/src/notifications.module.ts`).
