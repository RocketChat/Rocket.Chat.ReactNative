---
name: verify-voip-accept
description: 'Model-check the VoIP native-accept flow (acceptNativeCallWithReadiness, answerCall, endCall, applyRestStateSignals, VoipAcceptSucceeded, nativeAcceptedCallId) against the rule that a call the user ended from the system call UI is never connected by the app. Use when a change touches app/lib/services/voip accept/answer/end code, useCallStore nativeAcceptedCallId, MediaCallEvents accept handling, or native VoipService accept/end handling.'
metadata:
  covers:
    - app/lib/services/voip/MediaCallEvents.ts
    - app/lib/services/voip/MediaSessionInstance.ts
    - app/lib/services/voip/acceptNativeCall.ts
    - app/lib/services/voip/useCallStore.ts
    - ios/Libraries/VoipService.swift
    - package.json
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify the VoIP native-accept flow

This skill models what the app does with the call around the accept gate, and treats the gate's readiness as one step that succeeds or fails. `verify-native-accept-gate` owns the layer below it: how the gate's socket recovery, login wait and media-subscription wait reach that result.

## The rule

**A call the user ended from the system call UI (CallKit / Telecom) is never connected by the app afterwards.**

Harm when broken: the user hangs up, then the app binds the call, opens CallView and starts media, so the caller is connected to a phone whose owner thinks the call is over.

## Status at the sync commit

At the sync commit the current code breaks the rule. This is a known bug, not a modeling error, and `check.sh` records it in `known_broken`: while the model and the replay still break the rule, they print `BROKEN-AS-RECORDED` and the check exits 0. The two orderings below are reproduced against the real JS code by [replay/acceptAfterUserEnd.replay.test.ts](replay/acceptAfterUserEnd.replay.test.ts), which `check.sh` runs in place.

1. Native answers over REST and JS gets `VoipAcceptSucceeded`, which sets `nativeAcceptedCallId` and starts `acceptNativeCallWithReadiness`.
2. The gate waits on `recoverSocket` / `waitForLoginReady` / media subs. The session does not know the call yet.
3. The user presses End in CallKit. `endCall` finds no `getCallData`, so it sends nothing to the server, terminates the native call and clears `nativeAcceptedCallId`.
4. The gate resumes. `applyRestStateSignals` now lists the call, which the server still treats as accepted by this device. The gate then calls `answerCall` without re-checking `nativeAcceptedCallId`, so `accept()` succeeds, `setCall` runs and CallView opens.

Second ordering: the user presses End **before** `VoipAcceptSucceeded` reaches JS. The REST answer is still in flight, and `VoipService.swift` `finishAccept(true)` posts the event without checking whether CallKit already ended the call. Steps 1–4 then run with the End already behind them.

Third ordering, cold start: the user presses End before JS boots. JS never sees that End, and the stashed `VoipAcceptSucceeded` initial event still starts the gate in `getInitialMediaCallEvents`.

Orderings 1 and 2 occur on warm start and cold start (`getInitialMediaCallEvents` and `init`). A fix makes the model or the replay print `FIXED noConnectAfterUserEnd` and the check exit 1. Then update this skill in the same change: remove `noConnectAfterUserEnd` from `known_broken` in `check.sh`, turn the replay's assertions around so that each test passes when the call stays unbound, and rewrite this section.

In a copy of the model in a fresh `mktemp -d`, three changes together make the rule hold, and removing any one of them breaks it again:

- the gate answers only while `nativeAcceptedCallId === callId`;
- JS remembers a call id ended from the system UI and ignores a later `VoipAcceptSucceeded` for it;
- a cold-start initial event is ignored when CallKit already ended that call. This needs native help, because JS was not running when the user pressed End.

Sending the server a hangup for such a call also belongs to the fix; the model doesn't check that part.

## Does my change touch the verified code?

Run `git diff --stat <sync>..HEAD -- <files below>`, with `<sync>` the `metadata.sync` commit above, and `git diff <sync> -- package.json | grep media-signaling`. Also look for renamed or moved functions, and for new code that writes `nativeAcceptedCallId` or calls `answerCall`/`setCall` for an incoming call.

| Model action / helper                      | Code                                                                                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `voipAcceptSucceeded`                      | `app/lib/services/voip/MediaCallEvents.ts` `handleVoipAcceptSucceededFromNative`                                                                                                                          |
| `coldStartInitialEvents`                   | `MediaCallEvents.ts` `getInitialMediaCallEvents` (iOS answered, same workspace)                                                                                                                           |
| `userEndsInSystemUi`                       | `MediaCallEvents.ts` `RNCallKeep.addEventListener('endCall')` → `MediaSessionInstance.endCall`; on cold start before the accept event, JS is not running and only CallKit ends the call                   |
| `sessionInit`                              | `app/lib/services/voip/MediaSessionInstance.ts` `init`                                                                                                                                                    |
| `startGate`, `gateReady`, `gateReplayDone` | `app/lib/services/voip/acceptNativeCall.ts` `acceptNativeCallWithReadiness`, `handleFailure`                                                                                                              |
| `replayStateSignals`, `ungatedReplayDone`  | `MediaSessionInstance.ts` `applyRestStateSignals`, `tryAnswerIfNativeAcceptedNotification`                                                                                                                |
| `ddpAcceptedNotification`                  | `MediaSessionInstance.ts` `init` → `stream-notify-user` listener. It repeats the `tryAnswerIfNativeAcceptedNotification` guard, so a change to that guard edits both this action and `replayStateSignals` |
| `answerCall`                               | `MediaSessionInstance.ts` `answerCall`                                                                                                                                                                    |
| `sessionEndCall`                           | `MediaSessionInstance.ts` `endCall`                                                                                                                                                                       |
| `staleNativeTimer`                         | `app/lib/services/voip/useCallStore.ts` `createStaleNativeTimer`, `setNativeAcceptedCallId`, `resetNativeCallId`, `reset`                                                                                 |
| `sdkCall` transitions                      | `node_modules/@rocket.chat/media-signaling/dist/lib/Call.js` `accept`, `reject`, `hangup`, `flagAsAccepted`                                                                                               |
| ordering assumptions                       | `ios/Libraries/VoipService.swift` `handleNativeAccept` (`finishAccept`), `handleObservedCallChanged`                                                                                                      |

If none of these changed, the verification still describes the code; just run the check.

## Run

From the repo root:

```sh
.claude/skills/verify-voip-accept/check.sh           # check
.claude/skills/verify-voip-accept/check.sh --model   # check-model
```

The model runs on tla-ts 0.0.10 (TLA+ model checker on Node, no JVM) through `pnpm dlx`; the replay runs on the project's Jest. `check` takes about 10 seconds: one checker run for every rule expected to hold, one run for each rule in `known_broken` (it stops at the shortest failing path), and the replay. `check-model` adds the witness `neverConnects` (expected to break: a break proves that the app can connect a call the user did not end) and a run with `MAX_GATE_STARTS` and `MAX_UNGATED_REPLAYS` each raised by one, which must reach the same number of distinct states.

Each line is one result:

- `HOLDS settled`: every run ends in a state where `settled` holds, with no stuck gate or replay (the checker's deadlock check).
- `HOLDS <rule>`, `BROKEN-AS-RECORDED <rule>: <path>`, `NEW-BREAK <rule>: <path>`, `FIXED <rule>`: the rule holds or breaks, as recorded or not. A path is the list of model actions, read against the table above.
- `... noConnectAfterUserEnd replay: <test>`: one replay test. While the rule is in `known_broken`, a passing test reproduces the bug (`BROKEN-AS-RECORDED`) and a failing one is `FIXED`.
- `HOLDS biggerBounds` / `NEW-BREAK biggerBounds`: whether raising the bounds by one reaches new states. `STALE biggerBounds`: the bound constants changed; update the `sed` in `check.sh`.
- `ERROR ...`: the model did not compile, the checker stopped on an error, or Jest could not run the replay. The line names the output file. That is a problem with the verification, not a finding.

The last line names the results folder, a fresh `mktemp -d`, with the checker output (`<rule>.out`) and the replay's Jest output. Exit 0: every line is `HOLDS` or `BROKEN-AS-RECORDED`. Exit 1: some result changed. Exit 2: an `ERROR`.

To see every failing path instead of the shortest, copy `model/voip-accept.ts` into a fresh `mktemp -d` and run `pnpm dlx tla-ts@0.0.10 voip-accept.ts -continue` there.

Read every result with the `/statechart` skill, if this session has it. Give it `model/voip-accept.ts`. Without it, the printed paths are enough, read against the table above. For a failure it shows the shortest path to each broken rule in plain words. For a pass it draws how the flow moves between states.

## Real bug or modeling error?

For each failing path, walk the actions in the table above against the code, one step at a time:

- If some step cannot happen in the code, the model is wrong. Fix the model, rerun, and say what was wrong.
- If every step can happen, it is a bug. Reproduce it with a Jest replay in `replay/`, which `check.sh` runs in place. Its tests assert that the bug is present, so a test that fails after a fix means the fix worked. The second test sets `nativeAcceptedCallId` and starts the gate directly, below `handleVoipAcceptSucceededFromNative`, so a guard added in `MediaCallEvents.ts` needs a test that goes through that handler. The replay drives the real `acceptNativeCallWithReadiness`, `MediaSessionInstance` and `useCallStore` through `~/` imports. Only I/O and the SDK session are faked, with `accept()` following `Call.js`.

Report a bug as numbered steps in the code's words, plus the harm in one sentence. Do not weaken `noConnectAfterUserEnd` or remove actions to make it pass, and do not edit product code unless the user asks.

## Updating the model for an intended change

- Edit `model/voip-accept.ts` from the code, not from the result. One action is one synchronous JS segment between `await`s, and each action cites the code it mirrors.
- A new path that can bind an incoming call, or set or clear `nativeAcceptedCallId`, needs a new action. New state that such code reads (a Set, a flag, a timer) needs a new model variable. An event that a guard drops is still delivered: mark it delivered so it can't fire again.
- Keep the bounds (`MAX_GATE_STARTS`, `MAX_UNGATED_REPLAYS`, each event at most once). `check.sh --model` confirms that raising each by one reaches no new state, so they do not cut off any reachable state.
- Before trusting a pass, break the new code the way the rule guards against in a copy of the model in a fresh `mktemp -d`, for example drop the new guard, and confirm the checker reports the break there.
- Change the rule only if the promise changed on purpose, and cite the evidence (commit message, tests, docs).
- Run `check.sh --model` after any change to the skill's files.
- Move `metadata.sync` only to a commit on `develop`, and only after you have confirmed that the model describes the code at that commit. Update the status section with the new result.

## Scope and assumptions

Covered: one incoming call that native already answered over REST, on the same workspace, on warm start and on iOS cold start. Every ordering of these events is checked:

- the accept event;
- session init;
- gate readiness (success or failure);
- the gate's REST replay;
- REST replays the live gate isn't waiting on (from `init`, or from an aborted gate);
- the DDP `notification/accepted`;
- the 60 s stale timer;
- the user pressing End in CallKit, including on cold start before JS runs.

Not covered:

- Android Telecom end;
- cross-workspace hand-off through deep linking;
- peer hangup;
- outgoing calls;
- several calls at once;
- mute, hold and speaker;
- native-side races inside `VoipService.swift` / `VoipNotification.kt`.

Assumed: `Call.accept()` is synchronous, so `accept()` plus `setCall` in `answerCall` is one step. A REST replay's `processSignal` and `tryAnswer`, followed by the gate's continuation, is also one step. If no signal for the call has arrived yet, the session does not know it. Once this device sends a reject or hangup, the server stops listing the call in `media-calls.stateSignals`.
