---
name: verify-upload-lifecycle
description: Model-check the file upload lifecycle (uploadQueue, isUploadCancelled, endUpload, createUploadRecord, persistUploadError, cancelUpload, and the sendFileMessage callers) with tla-ts. Use before merging any change under app/lib/methods/sendFileMessage/, to UploadProgress retry, cancel or uploadCheck, or to how the composer or share view call sendAttachments.
metadata:
  covers:
    - app/lib/methods/sendFileMessage/index.ts
    - app/lib/methods/sendFileMessage/sendAttachments.ts
    - app/lib/methods/sendFileMessage/sendFileMessage.ts
    - app/lib/methods/sendFileMessage/sendFileMessageV2.ts
    - app/lib/methods/sendFileMessage/utils.ts
    - app/views/RoomView/components/UploadProgress.tsx
    - app/containers/MessageComposer/MessageComposer.tsx
    - app/containers/MessageComposer/components/RecordAudio/RecordAudio.tsx
    - app/views/ShareView/index.tsx
  check: $SKILL_DIR/check.sh
  check-model: $SKILL_DIR/check.sh --model
  sync: 427648b7346c229a5b1ada3a0a596ff7c1af0842
---

# Verify the upload lifecycle

Sending a file in a Room goes through `sendFileMessage` (`app/lib/methods/sendFileMessage/index.ts`). It calls `sendFileMessage.ts` for servers below 6.10.0 and `sendFileMessageV2.ts` for the rest. Both share the in-memory `uploadQueue` and the WatermelonDB `uploads` row in `utils.ts`, and both handle the queue the same way, so one model covers both. If the two ever diverge, add a model variable that picks the version and branch on it.

The model is `model/upload-lifecycle.ts`. It follows up to three sends of the same file in the same Room (`first`, `second`, `third`). Each send is one `sendFileMessage` call. `queued` records which send's `FileUpload` sits in `uploadQueue[uploadPath]`. TLC checks every order of their events. The model tracks sends separately because the code tells uploads apart by object identity: `isUploadCancelled` and `endUpload` compare `uploadQueue[uploadPath]` with the caller's own `upload`. Without that, a cancelled upload that settles late would act on the next upload of the same file.

## The rule

- `neverRefusedAfterUploadEnded`: once an upload of a file ends (sent, rejected by the server, cancelled), sending the same file again in the same Room is never refused as "Upload in progress".
  Harm: the user can't send that photo to that Room again until they restart the app.

## Does my change touch this?

It does if it changes any function listed under Coverage, who calls `sendFileMessage` / `sendAttachments`, or whether the caller passes `isForceTryAgain`. If so, run the check and compare the model with the code. To list what changed since the model last matched the code:

```sh
git diff 427648b7346c229a5b1ada3a0a596ff7c1af0842 -- app/lib/methods/sendFileMessage app/views/RoomView/components/UploadProgress.tsx
```

## Run it

```sh
.claude/skills/verify-upload-lifecycle/check.sh
```

It copies the model to a fresh `mktemp -d` and runs `pnpm dlx tla-ts@0.0.10` there, in about 1 s. It checks the rule over 759 states and prints `HOLDS` or `NEW-BREAK`. `ERROR` means the model did not compile or TLC did not finish. The exit code is 0 only when every line is `HOLDS`.

After you edit the model or this skill, also run:

```sh
.claude/skills/verify-upload-lifecycle/check.sh --model
```

It adds mutants, each a broken guard in a copy of the model that must print `CAUGHT` (`MISSED` means the rule no longer catches the break it guards; `STALE` means the mutation's target text changed), and reruns the rule with four sends (5499 states). It takes about 6 s.

To check an edited copy of the model, such as one that mirrors a change you are reviewing, put it in a fresh `mktemp -d` and pass its path: `.claude/skills/verify-upload-lifecycle/check.sh <path>/upload-lifecycle.ts`.

Read every result with `/statechart`: copy `model/upload-lifecycle.ts` and `model/upload-lifecycle.view.ts` to a fresh `mktemp -d` and point it at the copy, with `--out` in that folder. When the rule breaks, it gives its shortest path in plain words. When the rule holds, it draws the chart.

## Real bug or modeling error?

Replay the shortest path against the real code before you believe it either way. Each model action is one code event:

| Model action                 | Code                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `userSendsFile(send, false)` | `sendAttachments` from `MessageComposer.tsx` or `ShareView`, or `RecordAudio.tsx`, into `createUploadRecord`; refused when it alerts `Upload_in_progress` and returns `[null, null]` |
| `userSendsFile(send, true)`  | `UploadProgress.tsx` `tryAgain`, offered only on a failed row                                                                                                                        |
| `preparingFails(send)`       | `Encryption.encryptFile` or `copyFileToCacheDirectoryIfNeeded` throws before the `FileUpload` is created (`upload` still undefined)                                                  |
| `uploadStarts(send)`         | `uploadQueue[uploadPath] = upload`, then `upload.send()`                                                                                                                             |
| `serverAccepts(send)`        | `send()` (and `rooms.mediaConfirm` on V2) resolve; the row is destroyed; `finally` runs `endUpload`                                                                                  |
| `serverRejects(send)`        | `send()` or `rooms.mediaConfirm` reject, including the abort after a cancel; `catch` checks `isUploadCancelled`; `finally` runs `endUpload`                                          |
| `userCancels`                | `UploadProgress.tsx` `handleCancelUpload` → `cancelUpload`: `upload.cancel()`, delete the queue entry, destroy the row                                                               |
| `userDeletesFailedRow`       | `UploadProgress.tsx` `deleteUpload` (the close icon on a failed row)                                                                                                                 |
| `roomOpens`                  | `UploadProgress` mounts and runs `uploadCheck`, which marks failed every row without a queue entry                                                                                   |
| `appRestarts`                | the process restarts; every running call and `uploadQueue` are gone                                                                                                                  |

Write the replay as a Jest test beside `app/lib/methods/sendFileMessage/__tests__/uploadLifecycle.test.ts` (in it, or in a new file that copies its mocks). That file drives the real `sendFileMessage` / `sendFileMessageV2` and `utils.ts`. Its `FileUpload` mock exposes each pending `send()` (`mockSends`). Set `mockHoldCancelledSends` to hold a cancelled send (`mockCancelledSends`) until the test rejects it. Hold `Encryption.encryptFile` with `mockImplementationOnce` to stop a send while its file is being prepared. `uploadCheck` lives in the `UploadProgress` class component, so for `roomOpens` mirror its filter in the test: a row whose `isUploadActive` is false gets `error = true`. If the code does not do what the path says, the model is wrong: fix the model, not the rule.

## When a change is intended

Change the model action that mirrors the changed code, rerun, and replay any new path. Never weaken or delete a rule to get a pass. If a rule needs a variable the model lacks, add it.

## Scope and assumptions

The model has no guard the code lacks. A send is running from `createUploadRecord` until it settles, but `uploadQueue` holds its entry only from `upload.send()` on. While the file is being prepared (`Encryption.encryptFile`, `copyFileToCacheDirectoryIfNeeded`), the code treats the upload as not running: a second send is not refused, opening the Room marks the row failed, and a cancel destroys only the row. The rule above holds through all of that.

Limits:

- One file in one Room. A different file or Room never shares the queue key (`${path}-${rid}`), so they run independently. The queue key and the row id both come from the path the caller passed, even when the file is copied to the cache first; `copyFileToCacheDirectoryIfNeeded` returns the copy's path without changing `fileInfo.path`.
- At most three sends of that file in `check`. `check --model` reruns the rule with four sends (5499 states).
- A cancelled upload always settles by rejecting (`serverAccepts` returns for a cancelled send). The model leaves out a cancel that lands after the server accepted, such as during V2's `rooms.mediaConfirm`. In that case the late `destroyPermanently` deletes the row by id, even if a newer send of the same file has created it again.
- Each `await` boundary that matters is one action. Progress events inside `FileUpload` are not modeled.

## Coverage

| Covered code                                                                                                                                                              | Model                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/methods/sendFileMessage/utils.ts`: `uploadQueue`, `isUploadActive`, `isUploadCancelled`, `endUpload`, `cancelUpload`, `persistUploadError`, `createUploadRecord` | `queued`, `record`, `isUploadCancelled`, `endUpload`, `userCancels`, `persistUploadError`, the refusal in `userSendsFile` |
| `app/lib/methods/sendFileMessage/sendFileMessageV2.ts`: `sendFileMessageV2`                                                                                               | `userSendsFile`, `preparingFails`, `uploadStarts`, `serverAccepts`, `serverRejects`                                       |
| `app/lib/methods/sendFileMessage/sendFileMessage.ts`: `sendFileMessage`                                                                                                   | same actions                                                                                                              |
| `app/views/RoomView/components/UploadProgress.tsx`: `uploadCheck`, `tryAgain`, `handleCancelUpload`, `deleteUpload`                                                       | `roomOpens`, `userSendsFile(send, true)`, `userCancels`, `userDeletesFailedRow`                                           |

Sync commit: `427648b7346c229a5b1ada3a0a596ff7c1af0842` (also `metadata.sync`). The model describes the covered code as of this commit. Move it forward only to a commit on `develop`, after you have compared every covered function with its model action at that commit.
