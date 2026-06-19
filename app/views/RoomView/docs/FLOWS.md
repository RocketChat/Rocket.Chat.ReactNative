# Room Message Loading Flows

Sequence diagrams for the jump and window-management handshakes that span `RoomView`, the `List` hooks, the pure anchor resolvers, and WatermelonDB. Each diagram describes ordering and ownership; method signatures and parameter names live in the code, not here. Read `ARCHITECTURE.md` first — these diagrams assume its vocabulary (Message Window, Live Tail, Anchored Window, Newer Loader, `highTs`).

---

## 1. Jump to a target already in the window

The cheapest path: a nearby quoted reply or a target the rendered window already contains. No anchoring, no I/O — scroll in place.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant RV as RoomView
    participant List as List handle
    participant Scroll as useScroll
    participant FlatList

    User->>RV: tap quoted reply / jump
    RV->>List: jumpToMessage(id)
    List->>List: isMessageInWindow(id)? yes
    List->>Scroll: jumpToMessage(id, null)
    Scroll->>Scroll: target already in messages
    Scroll->>FlatList: scrollToTarget (two-pass)
    Scroll->>Scroll: completeJump — clear safety, highlight
```

_Last verified: f78d6a37c_

---

## 2. Jump to a server-fetched target (anchored)

Target not in the window and not cached. Resolve a bound from a freshly fetched Chunk, re-seed the window, await the re-observe, scroll once.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant RV as RoomView
    participant Resolve as resolveJumpAnchor
    participant Server as loadSurroundingMessages
    participant AR as anchorForServerChunk (pure)
    participant Msgs as useMessages
    participant DB as WatermelonDB
    participant Scroll as useScroll
    participant FlatList

    User->>RV: jump to message id
    RV->>RV: getMessageInfo(id) → target {ts, fromServer}
    RV->>Resolve: resolveJumpAnchor(rid, target, inWindow=false)
    Resolve->>Server: fetch one Chunk centered on target
    Server-->>Resolve: chunk rows
    Resolve->>AR: anchorForServerChunk(rows, id, ts)
    AR-->>Resolve: highTs (Newer Loader ts) | null
    Resolve-->>RV: bound
    RV->>Scroll: jumpToMessage(id, highTs)
    Scroll->>Msgs: setHighTs(bound)  %% count→0, re-seed
    Msgs->>DB: observe ts<=highTs, take(QUERY_SIZE)
    DB-->>Msgs: anchored page (incl. target)
    Note over Scroll: re-observe effect keyed on messages
    Scroll->>Scroll: target appeared → scroll once
    Scroll->>FlatList: scrollToTarget
    Scroll->>Scroll: completeJump
```

_Last verified: f78d6a37c_

---

## 3. Deep target — growth retries and the safety net

A target whose first anchored page does not yet contain it. The re-observe effect grows the window a page at a time, bounded, refreshing the safety net on each productive growth. An unreachable target aborts and releases the anchor.

```mermaid
sequenceDiagram
    autonumber
    participant Scroll as useScroll
    participant Msgs as useMessages
    participant DB as WatermelonDB
    participant Safety as safety timer

    Scroll->>Scroll: jump start — reset retries, arm safety (5s)
    loop target not yet observed (≤ MAX_JUMP_GROWTH_RETRIES)
        Scroll->>Msgs: fetchMessages()  %% count += QUERY_SIZE
        Msgs->>DB: re-observe wider page
        DB-->>Scroll: emit (still no target)
        Scroll->>Safety: refresh (productive growth)
    end
    alt target appears
        Scroll->>Scroll: scroll once, completeJump (clear safety)
    else retries exhausted / safety fires
        Safety->>Scroll: abortJump
        Scroll->>Msgs: setHighTs(null)  %% release anchor
        Scroll->>Scroll: clear spinner — user not stuck
    end
```

_Last verified: f78d6a37c_

---

## 4. Scroll landing — frontier climb

The inverted list has no `getItemLayout`, so `scrollToIndex` cannot reach an unmeasured frame. On failure, step to the measured frontier (which advances it a render batch), then re-attempt — deferred one frame to break `VirtualizedList`'s synchronous re-fire, capped at `MAX_SCROLL_TO_INDEX_RETRIES`.

```mermaid
sequenceDiagram
    autonumber
    participant Scroll as useScroll
    participant FlatList

    Scroll->>FlatList: scrollToIndex(target)
    FlatList-->>Scroll: onScrollToIndexFailed(highestMeasuredFrameIndex)
    loop target past frontier (≤ MAX_SCROLL_TO_INDEX_RETRIES)
        Scroll->>FlatList: scrollToIndex(frontier)  %% moves viewport
        Note over FlatList: render batch measured, frontier advances
        Scroll->>Scroll: defer one frame
        Scroll->>FlatList: scrollToIndex(target) retry
    end
    Scroll->>Scroll: target measured → land, completeJump
```

_Last verified: f78d6a37c_

---

## 5. Rejoin the Live Tail — raise / release climb

The user scrolls up from an Anchored Window and resolves "Load newer" Loaders. Each consumed boundary Newer Loader either raises the bound toward live or releases the window once the Gap closes.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant List as List / FlatList
    participant Loader as loadNextMessages
    participant DB as WatermelonDB
    participant Msgs as useMessages.raiseOrReleaseAnchor
    participant RR as raiseOrRelease (pure)

    User->>List: scroll up to Newer Loader
    List->>Loader: load next batch
    Loader->>DB: write batch + new Loader above old bound
    DB-->>Msgs: emit (boundary Loader present→absent)
    Msgs->>DB: read region above highTs
    Msgs->>RR: raiseOrRelease(rowsAbove, highTs)
    alt Newer Loaders remain
        RR-->>Msgs: max loader ts (climb)
        Msgs->>Msgs: RAISE highTs — keep count, grow a page
    else none remain (Gap closed)
        RR-->>Msgs: null
        Msgs->>Msgs: count += rows above old bound
        Msgs->>Msgs: RELEASE → Live Window
    end
```

_Last verified: f78d6a37c_

---

## 6. Jump to bottom (rejoin live via FAB)

The Anchored Window forces the jump-to-bottom FAB visible (the loaded rows' bottom edge isn't the Live Tail). Tapping it releases the anchor and scrolls to the newest Message.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant List as List
    participant Scroll as useScroll
    participant Msgs as useMessages
    participant FlatList

    User->>List: tap jump-to-bottom FAB
    List->>Scroll: jumpToBottom()
    Scroll->>Msgs: setHighTs(null)  %% release, count→0
    Msgs-->>FlatList: re-seed Live Window (newest page)
    Scroll->>FlatList: scrollToOffset(0)  %% inverted → newest
```

_Last verified: f78d6a37c_

---

## 7. Thread jump timing

A thread jump must fire after the thread rows load, not at mount. Firing early aborts on the safety net and parks on the Live Tail. The param is read-and-cleared so concurrent `init()` callers cannot re-fire it.

```mermaid
sequenceDiagram
    autonumber
    participant Nav as navigation param
    participant RV as RoomView
    participant Init as init()
    participant Thread as loadThreadMessages
    participant List as List handle

    Nav->>RV: jumpToMessageId (thread target)
    RV->>RV: componentDidMount — main-list jump fires now; thread jump deferred
    RV->>Init: init()
    Init->>Thread: loadThreadMessages
    Thread-->>Init: thread rows present
    Init->>RV: read-and-clear jumpToMessageId
    RV->>List: jumpToMessage(id)  %% rows exist → lands
```

_Last verified: f78d6a37c_
