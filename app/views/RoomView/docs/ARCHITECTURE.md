# Room Message Loading Architecture

Load-bearing reference for how the Room view loads, observes, and re-positions Messages. Read this before `FLOWS.md` — that document assumes the vocabulary defined here. Domain terms (Message Window, Live Tail, Anchored Window, Chunk, Gap, Loader Row) are defined in the repo glossary `CONTEXT.md` under "Message Loading"; this document uses them as defined there.

## Overview

The Room view renders a **Message Window**: the contiguous range of Messages it currently observes from the local WatermelonDB database, distinct from everything synced to disk. The window has two modes:

- **Live Window** — newest-first, anchored to the **Live Tail**. Grows older as the user scrolls up and follows new Messages at the bottom. This is the default.
- **Anchored Window** — pinned around a **Jump to Message** target that sits far from the Live Tail. Deliberately does _not_ follow new Messages until the user explicitly rejoins live.

The single piece of state that distinguishes them is `highTs`: an optional **upper** `ts` bound on the observation.

- `highTs == null` → Live Window. The query is a growing `take(count)` from the newest Message.
- `highTs == <ms since epoch>` → Anchored Window. One extra clause, `Q.where('ts', Q.lte(highTs))`, caps the window below the Live Tail.

A **Jump to Message** to a far-off or not-yet-synced target sets `highTs` so the window re-seeds onto the target in one step, instead of paging from the Live Tail down to it. Rejoining live releases `highTs` back to `null`.

The list engine is the custom native Fabric `InvertedScrollView` (`List/components/InvertedScrollView.tsx`) under an `inverted` `Animated.FlatList` — not FlashList. See [Why not FlashList](#why-not-flashlist).

---

## Layers

| Layer                   | Owner                                                                                       | Responsibility                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Window observation      | `List/hooks/useMessages.ts`                                                                 | Owns `highTs` and the WatermelonDB observation. Re-seeds on anchor change, grows on demand, and climbs/releases the anchor back toward live.                                                                                                                                                                                                        |
| Scroll & jump lifecycle | `List/hooks/useScroll.ts`                                                                   | Owns a pending jump: re-anchor → await re-observe → scroll once → complete; plus the safety net, growth retries, and `onScrollToIndexFailed` climb.                                                                                                                                                                                                 |
| Anchor decision         | `services/anchorResolver.ts`, `services/resolveJumpAnchor.ts`, `services/getLocalAnchor.ts` | Decide the `highTs` bound for a jump, and whether to raise or release it. `anchorResolver.ts` and the decision logic in `resolveJumpAnchor.ts` are pure (rows/ts only, no React, no DB) and unit-tested with plain objects. `getLocalAnchor.ts` (`getLocalAnchorTs`) queries WatermelonDB for the local-cache path and requires a DB mock in tests. |
| Wiring                  | `List/index.tsx`, `List/components/List.tsx`                                                | Wires the hooks to the `FlatList`, exposes the `jumpToMessage` / `isMessageInWindow` imperative handle, and threads `isAnchored` to the FAB.                                                                                                                                                                                                        |
| Orchestration           | `services/jumpToMessage.ts`, `hooks/useJumpToMessage.ts`                                    | `jumpToMessage.ts` resolves the target Message, routes it to another Room or Thread when it does not belong to the current window, computes the anchor via the pure resolver, and drives the list's `jumpToMessage`. `useJumpToMessage.ts` owns the jump-from-navigation-param lifecycle.                                                           |

---

## State model

### The window bound (`useMessages`)

`useMessages` holds `highTs` plus a `count` ref (the current `take()` size). Two setters change the window:

- **`setHighTs(next)`** — the public re-seed. Resets `count` to `0` (so the re-subscribe lands at exactly one page, `QUERY_SIZE`) and clears the boundary-loader tracking, then sets the bound. Used by a fresh jump and by jump-to-bottom. Passing `null` releases an Anchored Window back to a Live Window.
- **`fetchMessages()`** — grows the _current_ window by one page (`count += QUERY_SIZE`) and re-subscribes. Used by scroll-to-end pagination and by the jump growth retry. Does **not** change `highTs`.

The observation re-subscribes whenever `highTs` (or `rid`/`tmid`/filters) changes. Thread (`tmid`) and local windows are never anchored — only the main room observation carries a bound.

### The pending jump (`useScroll`)

A jump is one `IPendingJump` at a time (`pendingJump.current`):

```
{ messageId, anchored, scrolled, resolve, safety }
```

`anchored` records whether this jump set a bound (so abort knows to release it). `scrolled` guards against scrolling more than once as rows keep re-emitting. The jump completes **reactively**: a `useLayoutEffect` keyed on `messages` checks, on every re-observe, whether the target has appeared; the first time it has, it scrolls once and resolves. There is no scroll-until-present polling loop.

Three bounded counters keep a jump terminating:

- `jumpGrowthRetries` (cap `MAX_JUMP_GROWTH_RETRIES = 5`) — window growths while waiting for a deep Anchored target to re-observe.
- `scrollFailRetries` (cap `MAX_SCROLL_TO_INDEX_RETRIES = 20`) — `onScrollToIndexFailed` retries while climbing to the target's frame.
- The safety net (`JUMP_SAFETY_TIMEOUT = 5000ms`) — aborts only if the target _never_ re-observes. Refreshed on each productive growth so a deep, still-loading target is not aborted mid-load. It cannot interrupt a completed scroll: `completeJump` clears it the moment the target appears.

All three reset at jump start. The safety net releases the anchor and clears the spinner on abort, so the user is never left stuck.

---

## Anchor resolution

The decision "what `highTs`, if any, does this jump need?" is pure and tested. `resolveJumpAnchor` is the entry point:

1. **Stay live (`null`)** — target is a thread message, `rid` missing, or the target is already in the rendered window (a nearby quoted reply scrolls in place). No anchoring, no I/O.
2. **Server-fetched target** — `loadSurroundingMessages` fetches one Chunk centered on the target; `anchorForServerChunk` brackets it:
   - A **Newer Loader** above the target ⇒ the Chunk is non-contiguous with the Live Tail ⇒ anchor at that Loader's `ts` (finite `highTs`, Anchored Window).
   - Target present, no Newer Loader above ⇒ the Chunk reaches the Live Tail ⇒ `null`, stay live. Anchoring here would pin the room with no boundary Loader to ever release against — new Messages would never render.
   - Target absent / empty Chunk ⇒ anchor at the target's own `ts` so the window still re-seeds onto it.
3. **Cached-but-out-of-window target** — `getLocalAnchorTs` finds the nearest Newer Loader above the target in the local cache (the upper bracket of a gappy island left by a prior jump). Found ⇒ anchor there. None ⇒ fall back to the target's own `ts`.

The bound is always the `ts` of a **Newer Loader** when one exists, because that Loader is the boundary the rejoin climb later consumes.

### Equal-`ts` limitation

The bound is a scalar `ts`, so two rows sharing it cannot be split — a jump may land on the wrong one of an equal-`ts` pair. The server path emits a `__DEV__` warning when the resolved bound collides; the local path cannot even detect it. The deferred fix is composite `(ts, _id)` ordering; ordering stays `ts`-only today (a tie / clock-skew weakness, rare in practice).

---

## Rejoin (raise / release)

An Anchored Window sits below the Live Tail with a boundary **Newer Loader** at `ts === highTs`. The user climbs back to live by resolving "Load newer" Loaders. `useMessages.raiseOrReleaseAnchor` runs on each emit while anchored:

- It tracks whether the boundary Newer Loader was present in the previous emit. A **present → absent** transition means `loadNextMessages` consumed it and wrote the next batch + a new Loader _above_ the current bound — which the bounded observation (`ts <= highTs`) cannot see.
- On that transition it reads the region above the bound directly and hands it to the pure `raiseOrRelease`:
  - **Newer Loaders remain** ⇒ RAISE: climb the bound to the Loader nearest the Live Tail (monotonic, never moves backward). `count` is left intact so the next re-subscribe _grows_ the window by a page and the user's reading position is preserved alongside the newly revealed batch.
  - **No Newer Loader remains** ⇒ the Gap to the Live Tail has closed ⇒ RELEASE to `null`. Before releasing, `count` is grown by the number of rows now above the old bound, so the released `take(count)` does not re-anchor at the tail and evict the deep target the user is reading.

`raiseOrRelease` never releases across an open Gap: while any Newer Loader is present it returns the maximum (the Loader nearest live), only returning `null` once none remain.

> **Watch item:** the `count += aboveCount` growth on RELEASE re-seeds a large `take(count)` when many pages sit between the old bound and the Live Tail. It is a deliberate tradeoff (preserves reading position; all rows are cached) and not observed as a real spike. Revisit if release-time render/memory spikes appear in profiling.

---

## Scroll landing

The inverted list has no `getItemLayout` for its variable-height Messages, so `scrollToIndex` works off an **estimated** offset and cannot reach a frame that was never rendered. Two mechanisms close the gap:

- **Two-pass scroll** (`scrollToTarget`) — the first scroll renders the target's row; once measured, a second scroll (re-reading the index in case the window shifted) lands precisely.
- **Frontier climb** (`handleScrollToIndexFailed`) — when the target sits past the measured frontier (`highestMeasuredFrameIndex`), scrolling straight to it fails _without moving the viewport_, so the render window plateaus short. Instead, step the viewport to the measured frontier first — that advances `highestMeasuredFrameIndex` by a render batch — then re-attempt the target. `VirtualizedList` re-fires `onScrollToIndexFailed` synchronously, which would recurse to a stack overflow, so each retry is deferred one frame and capped.

`initialNumToRender={20}` seeds a wide-enough window that a freshly anchored target usually falls inside the first render; `maintainVisibleContentPosition` freezes window growth during the jump, so a smaller seed would leave the target unmeasured and the list would park short of it.

---

## Why not FlashList

To make Jump to Message O(1) instead of O(pages), the existing WatermelonDB observation is capped with an optional upper `ts` bound — producing an Anchored Window around the target — rather than migrating the list engine to FlashList v2.

- **Migrate to FlashList v2 (rejected).** v2 deprecates `inverted` and would discard the custom native `InvertedScrollView` and its Fabric touch-event-routing fix (legacy interop drops interaction events for Fabric children). A large, risky change for behavior achievable without it.
- **Bounded `ts` window on the existing inverted list (chosen).** The only new capability a centered jump needs is an _upper_ bound; the existing growing `take(count)` already handles the lower extent, Loader Rows, `MAX_AUTO_LOADS`, and the `hideSystemMessages` clause.

Consequences:

- A jump re-anchors in one step rather than growing the window page by page, so its cost does not scale with the distance to the target and no wall-clock race can cancel a valid in-flight scroll on a slow device.
- An Anchored Window deliberately sits below the Live Tail, so rejoining live is explicit: the Load Newer climb, or the jump-to-bottom FAB.
- The list engine stays the inverted `FlatList`; a FlashList migration remains possible but is neither blocked nor required.
- Ordering stays `ts`-only (see [Equal-`ts` limitation](#equal-ts-limitation)); `ts + _id` is a deferred option.

---

## Invariants

Each bullet names the test under `app/views/RoomView/` that holds it, or the code that carries it where no test does. CI does not enforce them as invariants — they are author obligations during review.

- **Single bound distinguishes the modes** — `highTs == null` is the only Live Window; any finite `highTs` is an Anchored Window. The `<List isAnchored={highTs != null}>` prop and every anchored branch read this one source.
- **Anchor re-seeds to one page** — `setHighTs` resets `count` to `0` so a fresh anchor lands at exactly `QUERY_SIZE`, not the grown size of the prior window. Verified by `useMessages.test.tsx`.
- **Monotonic climb, no release across a Gap** — `raiseOrRelease` returns `null` only when no Newer Loader remains; otherwise the maximum Loader `ts`, clamped so the bound never moves backward. Verified by `anchorResolver.test.ts`.
- **Reading position survives release** — RELEASE grows `count` by the rows above the old bound before clearing it, so the released window does not snap to the Live Tail. See `useMessages.raiseOrReleaseAnchor`.
- **Stale-subscription guard** — `raiseOrReleaseAnchor` pins to the subscription that fired the emit and bails if `fetchMessages` re-subscribed during its awaits, so a room switch / concurrent raise cannot mutate the new window's `count` / `highTs`.
- **Exactly one scroll per jump** — `jump.scrolled` gates the re-observe effect and the synchronous in-window path; a jump scrolls once and completes. Verified by `useScroll.test.tsx`.
- **Every jump terminates** — growth retries, scroll-fail retries, and the safety net are all bounded and reset per jump; an unreachable target aborts (releasing the anchor) instead of looping. Verified by `useScroll.test.tsx`.
- **Frontier climb advances, never recurses** — `onScrollToIndexFailed` steps to `highestMeasuredFrameIndex` (which moves the viewport) rather than re-scrolling to the unmeasured target, and defers each retry one frame to break `VirtualizedList`'s synchronous re-fire. Verified by `useScroll.test.tsx`.
- **Thread jump fires after thread rows load** — the RoomStore's `init()` calls `onThreadMessagesLoaded` right after `loadThreadMessages`, and `useJumpToMessage` fires the pending thread jump from there rather than from its own mount effect; firing before the rows exist aborts on the safety net and parks on the Live Tail. The pending id is read-and-cleared so a later `init()` cannot re-fire it. See `hooks/useJumpToMessage.ts` and `stores/RoomStore.ts`.
- **Jump param is one-shot** — `useJumpToMessage` clears the `jumpToMessageId` route param after firing, so re-selecting the same id reads as an `undefined → id` change and re-fires instead of no-opping on a stale param. Verified by `hooks/__tests__/useJumpToMessage.test.tsx`.
- **Read-time derivations depend on observed columns** — `useReadOnly` and `useE2EEStatus` derive synchronously from the observed `room`, so they only stay reactive while `roles`, `encrypted`, and `E2EKey` remain in `roomAttrsUpdate`. Dropping any of them silently stales the read-only banner / E2EE gate. Verified by `constants.test.ts`.
