# Bounded message window over FlashList migration

To make Jump to Message O(1) instead of O(pages), we cap the existing WatermelonDB
message observation with an optional upper `ts` bound (`highTs`) — producing an
Anchored Window around the target — rather than migrating the list engine to FlashList v2.
The default Live Window is the same growing `take(count)`-from-newest query as before, with
no upper bound (`highTs == null`).

## Context

The room message list renders through a **custom native Fabric `InvertedScrollView`**
(`components/InvertedScrollView.tsx`), not a vanilla `FlatList`. The previous Jump to Message
worked by repeatedly scrolling to the end and growing `take(count)` until the target entered
the window — a deep jump effectively loaded every page in between, and a 5s `Promise.race`
in `RoomView.jumpToMessage` could cancel the scroll before the window reached the target on
slow devices.

## Considered Options

- **Migrate to FlashList v2.** Rejected: v2 deprecates `inverted` and would discard the
  custom native `InvertedScrollView` and its Fabric touch-event-routing fix (legacy interop
  drops interaction events for Fabric children). A large, risky change for behavior we can add
  without it.
- **Bounded `ts` window on the existing inverted list (chosen).** The only new capability a
  centered jump needs is an _upper_ bound; the existing growing `take(count)` already handles
  the lower extent, loader rows, `MAX_AUTO_LOADS`, and the `hideSystemMessages` clause.

## Decision

Add one optional `Q.where('ts', Q.lte(highTs))` clause to the observation. `highTs` is taken
from the `NEXT_CHUNK` (Newer Loader) bounding the surrounding chunk that `loadSurroundingMessages`
already writes. The window anchors on the target; the existing "Load Newer" `LoadMore` flow climbs
back toward live, and `highTs` is released to `null` once the gap to the Live Tail closes.

## Consequences

- Jump to Message no longer grows the window page-by-page; it re-anchors in one step, removing
  the root cause of the 5s-race flakiness.
- An Anchored Window deliberately sits below the Live Tail, so "rejoin live" is now explicit
  (Load Newer chain, or the jump-to-bottom FAB) — previously free because the window always
  contained live.
- The list engine is unchanged; a future FlashList migration remains possible but is not blocked
  or required by this work.
- Ordering stays `ts`-only (see the tie/clock-skew note in `useMessages`); `ts + _id` is a
  deferred option.
