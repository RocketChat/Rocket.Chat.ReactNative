---
name: verify-upload-lifecycle
description: Model-check the file upload lifecycle (uploadQueue, createUploadRecord, persistUploadError, cancelUpload and the sendFileMessage callers) with tla-ts. Use before merging any change under app/lib/methods/sendFileMessage/, to UploadProgress retry/cancel, or to how the composer or share view call sendAttachments.
---

# Verify the upload lifecycle

Sending a file in a Room goes through `sendFileMessage` (`app/lib/methods/sendFileMessage/index.ts`), which picks `sendFileMessage.ts` (servers below 6.10.0) or `sendFileMessageV2.ts`. Both share the in-memory `uploadQueue` and the WatermelonDB `uploads` row in `utils.ts`, and both handle the queue the same way, so one model covers them. If the two callers ever diverge, add a variable that picks the caller and branch on it. The model lives in `model/upload-lifecycle.ts`, and TLC checks every order of its events.

## The rules

- `neverRefusedAfterUploadEnded`: once an upload of a file ends (sent, rejected by the server, cancelled), sending the same file again in the same Room is never refused as "Upload in progress".
  Harm: the user can't send that photo to that Room again until they restart the app.
- `runningUploadNeverShownFailed`: an upload that is still running never shows as failed in the Room.
  Harm: the progress row turns into a failed row with a retry button while the file is still uploading.

## Does my change touch this?

Yes, if it changes any line listed under Coverage, or who calls `sendFileMessage` / `sendAttachments`, or whether the caller passes `isForceTryAgain`. Then run the check and compare the model with the code.

## Run it

```sh
.claude/skills/verify-upload-lifecycle/check.sh
```

It runs `pnpm dlx tla-ts@0.0.10` on the model (about 1 s, a few dozen states) and exits 0 when every rule holds, 1 when a rule breaks (it names the rules), and 2 when the model does not compile. The compiled `UploadLifecycle.tla` and `.cfg` beside the model are regenerated on each run and are not committed.

Read every result with `/statechart`, pointing it at `model/upload-lifecycle.ts`; it picks up `model/upload-lifecycle.view.ts` and turns each broken rule into its shortest path in plain words, or draws the chart when everything holds.

## Real bug or modeling error?

Replay the shortest path against the real code before believing either. Each model action is one code event:

| Model action           | Code                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `userSendsFile(false)` | `sendAttachments` from `MessageComposer.tsx` or `ShareView`, or `RecordAudio.tsx`, into `createUploadRecord` |
| `userSendsFile(true)`  | `UploadProgress.tsx` `tryAgain` (only offered on a failed row)                                               |
| `preparingFails`       | `Encryption.encryptFile` or `copyFileToCacheDirectoryIfNeeded` throws before the `FileUpload` is created     |
| `uploadStarts`         | `uploadQueue[uploadPath] = upload` then `upload.send()`                                                      |
| `serverAccepts`        | `send()` (and `rooms.mediaConfirm` on V2) resolve; the row is destroyed; `finally` runs `endUpload`          |
| `serverRejects`        | `send()` or `rooms.mediaConfirm` reject; `catch` persists the error; `finally` runs `endUpload`              |
| `userCancels`          | `UploadProgress.tsx` `handleCancelUpload` → `cancelUpload`                                                   |
| `appRestarts`          | process restart clears `uploadQueue`; `UploadProgress.uploadCheck` marks rows without a queue entry failed   |

Write the replay as a Jest test in `app/lib/methods/sendFileMessage/__tests__/` that drives the real `sendFileMessage`/`sendFileMessageV2` and `utils.ts` through the same steps (see `uploadLifecycle.test.ts` there). If the code does not do what the path says, the model is wrong: fix the model, not the rule.

## When a change is intended

Change the model action that mirrors the changed code, rerun, and replay any new path. Never weaken or delete a rule to get a pass; add a model variable when a rule needs one.

## Scope and assumptions

- One file in one Room; a second Room or a different file never shares a queue key (`${path}-${rid}`), so they are independent.
- One upload in flight at a time. A second send while the first is still being prepared and not refused would start a second upload of the same file; the model drops that step (`userSendsFile` returns) and does not check duplicate uploads.
- Cancel while the file is being prepared is left out (the row exists but `send()` has not started).
- Each `await` boundary that matters is one action; what happens inside `FileUpload` (progress events) is not modeled.

## Coverage

| Covered code                                                                                                                                                              | Model                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `app/lib/methods/sendFileMessage/utils.ts`: `uploadQueue`, `isUploadActive`, `isUploadCancelled`, `endUpload`, `cancelUpload`, `persistUploadError`, `createUploadRecord` | `queued`, `record`, `isRefused`, `refuse`, `userCancels`, `persistUploadError`      |
| `app/lib/methods/sendFileMessage/sendFileMessageV2.ts`: `sendFileMessageV2`                                                                                               | `userSendsFile`, `preparingFails`, `uploadStarts`, `serverAccepts`, `serverRejects` |
| `app/lib/methods/sendFileMessage/sendFileMessage.ts`: `sendFileMessage`                                                                                                   | same actions                                                                        |
| `app/views/RoomView/components/UploadProgress.tsx`: `uploadCheck`, `tryAgain`, `handleCancelUpload`                                                                       | `appRestarts`, `userSendsFile(true)`, `userCancels`                                 |

Sync commit: `9f973888ce1418d3063e5c6077dcde6fe7fbada2`. The model describes the covered code as of this commit. Move it forward only after you have compared every covered function with its model action at the new commit. To see what changed since:

```sh
git diff 9f973888ce1418d3063e5c6077dcde6fe7fbada2 -- app/lib/methods/sendFileMessage app/views/RoomView/components/UploadProgress.tsx
```
