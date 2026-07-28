# Ubiquitous Language

## Rooms & Conversations

| Term                | Definition                                                                                                                     | Aliases to avoid              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| **Room**            | A server-side conversation container with shared state (name, type, settings)                                                  | Chat, conversation            |
| **Subscription**    | A user's personal relationship to a Room, holding per-user state (unread count, favorite, muted, open)                         | Membership, room entry        |
| **Channel**         | A public Room (type `'c'`) visible to all server users                                                                         | Public room                   |
| **Group**           | A private Room (type `'p'`) visible only to invited members                                                                    | Private room, private channel |
| **Direct Message**  | A 1-on-1 private Room (type `'d'`) between two users                                                                           | DM, PM, private message       |
| **Thread**          | A branched conversation spawned from a single Message, identified by `tmid` (thread message id)                                | Reply chain                   |
| **Discussion**      | A separate Room spawned from a parent Room, identified by `prid` (parent room id) — unlike Threads, Discussions are full Rooms | Sub-room, sub-channel         |
| **Team**            | An organizational container that groups multiple Channels and users under a single entity                                      | Workspace (ambiguous)         |
| **Broadcast Room**  | A Room where only authorized users can send Messages; other users can only Reply Broadcast to existing Messages                | Broadcast channel             |
| **Reply Broadcast** | The action of replying to a Message in a Broadcast Room when the current user cannot send regular Messages                     | Broadcast reply               |

## Messages

### Core

| Term               | Definition                                                                                                   | Aliases to avoid            |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Message**        | A unit of communication within a Room, identified by `_id` with content in `msg` and parsed markdown in `md` | Chat message, text          |
| **Thread Message** | A Message that belongs to a Thread, identified by presence of `tmid`                                         | Reply, thread reply         |
| **Thread Parent**  | The Message a Thread is spawned from; the target of its Thread Messages' `tmid`                              | Thread root, parent message |
| **Attachment**     | Rich media or structured data embedded in a Message (image, video, audio, file, or action buttons)           | File, media                 |
| **Reaction**       | An emoji response to a Message, tracking which usernames reacted                                             | Emoji reaction              |
| **Mention**        | An `@username` reference within a Message that triggers notifications                                        | Tag, ping                   |
| **Draft Message**  | A user's unsent composition stored on a Subscription or Thread (`draftMessage` field)                        | Unsent message              |
| **Snippet**        | A saved excerpt from a Message                                                                               | —                           |

### System Messages

A **System Message** is any server-generated Message (carrying a `t` type field) rather than a user-typed one. The code draws a hard boundary between room-event system messages and typed-event system messages — keep them apart.

| Term                           | Definition                                                                                                                                                                                                       | Aliases to avoid            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **System Message**             | A server-generated Message identified by a `t` type field; umbrella term covering Info Messages and the typed events below                                                                                       | Event, notification         |
| **Info Message**               | A System Message that records a room event (user joined, room archived, role changed, muted) — rendered compact and non-interactive. Excludes `e2e`, `discussion-created`, `jitsi_call_started`, and `videoconf` | System event, event message |
| **Discussion-Created Message** | A System Message (`t = 'discussion-created'`) recording that a Discussion was spawned from this Message; rendered with a link to the new Room                                                                    | —                           |
| **Call Message**               | A System Message (`t = 'jitsi_call_started'` or `t = 'videoconf'`) recording a Video Conference and offering a join affordance                                                                                   | Video call message          |
| **Encrypted Message**          | A System Message (`t = 'e2e'`) whose content is pending E2E decryption (`e2e !== 'done'`); shown as an "Encrypted message" placeholder until decrypted                                                           | Pending E2E message         |

### Content & Visibility States

| Term                   | Definition                                                                                                                                  | Aliases to avoid        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Ignored Message**    | A Message whose author is an Ignored User in this Room; shown as a "Message ignored" placeholder until tapped to reveal                     | Muted message           |
| **Ignored User**       | A User the current user has hidden in a specific Room (`room.ignored` list); their Messages render as Ignored Messages                      | Muted user              |
| **Auto-Translate**     | A per-Room setting that replaces other users' Message bodies with translations in the user's chosen language                                | Live translate          |
| **Translated Message** | A Message whose body is shown via its auto-translated text, because Auto-Translate is on for the Room and the author is another user        | Auto-translated message |
| **Blocks Message**     | A Message whose body is structured Blocks from a Rocket.Chat App, rendered instead of markdown                                              | App message             |
| **Message Preview**    | A Message rendered outside its Room context (search, pinned, share extension, notifications); no interactions, reactions, or thread context | Preview row             |

## Message Grouping

| Term                 | Definition                                                                                                                                                   | Aliases to avoid        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **Message Header**   | The author block (avatar, name, timestamp) shown on the first Message of a grouped run; a Message either shows a Header or is grouped under the one above it | Title, byline           |
| **Grouped Message**  | A Message rendered without its own Header because it continues a run from the same author within the Grouping Period, visually attached to the Message above | Sequential, collapsed   |
| **Grouping Period**  | The maximum time gap between consecutive same-author Messages for them to share one Header (server setting `Message_GroupingPeriod`)                         | —                       |
| **Previous Message** | Relative to a given Message, the adjacent older Message; whether that Message shows a Header is derived from it (author, time, status, thread)               | Prior message, neighbor |

## Message Status

The delivery lifecycle of a Message (`status` field). Exactly one status at a time; not to be confused with Message Flags.

| Term      | Definition                                                           | Aliases to avoid |
| --------- | -------------------------------------------------------------------- | ---------------- |
| **Sent**  | Message successfully delivered to server (status `0`)                | Delivered        |
| **Temp**  | Message created locally but not yet confirmed by server (status `1`) | Pending, sending |
| **Error** | Message that failed to send (status `2`)                             | Failed           |

## Message Flags

Independent boolean markers on a Message, orthogonal to its Status — a Message can be both Pinned and Starred, and either regardless of delivery state.

| Term        | Definition                                                                                    | Aliases to avoid |
| ----------- | --------------------------------------------------------------------------------------------- | ---------------- |
| **Pinned**  | A Message flagged as important for the whole Room; visible to all Members via the pinned list | Bookmarked       |
| **Starred** | A Message bookmarked by the current user for personal reference; visible only to that user    | Saved            |

## Message Separators

| Term                 | Definition                                                                                       | Aliases to avoid |
| -------------------- | ------------------------------------------------------------------------------------------------ | ---------------- |
| **Date Separator**   | A divider rendered between two Messages on different days, showing the date of the newer Message | Date divider     |
| **Unread Separator** | A divider rendered between the last read Message and the first unread Message in a Room          | Unread divider   |

## Message Loading

| Term                | Definition                                                                                                                         | Aliases to avoid       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Message Window**  | The contiguous range of Messages the Room view currently observes and renders (distinct from what is synced to the database)       | Page, feed             |
| **Live Tail**       | The newest end of a Room's Messages; a Message Window at the Live Tail receives new Messages automatically                         | Bottom, latest         |
| **Live Window**     | A Message Window whose newest edge is the Live Tail — grows older as you scroll up and follows new Messages at the bottom          | —                      |
| **Anchored Window** | A Message Window pinned around a Jump to Message target instead of the Live Tail; deliberately does not follow new Messages        | —                      |
| **Chunk**           | A contiguous run of Messages synced from the server into the local database, bracketed by Loader Rows where more exists            | Batch, page            |
| **Gap**             | A region between two Chunks where Messages exist on the server but not yet locally; represented by a Loader Row                    | Hole                   |
| **Loader Row**      | A placeholder Message record marking a Gap; becoming visible triggers a server fetch                                               | Load-more, spinner row |
| **Older Loader**    | A Loader Row marking older Messages (types `MORE`, `PREVIOUS_CHUNK`) — resolving it fetches Messages before it                     | Load previous          |
| **Newer Loader**    | A Loader Row marking newer Messages (type `NEXT_CHUNK`) — resolving it fetches Messages after it                                   | Load next              |
| **Room History**    | Older Messages of a Room fetched on demand from the server (distinct from **Server History**)                                      | Message history        |
| **Jump to Message** | Re-position the Room view onto a target Message that may be far from the Live Tail or not yet synced — fetches a surrounding Chunk | Scroll to message      |

## Timestamp Trust Boundary

Not every `_updatedAt` is worth the same. A Message's `_updatedAt` read out of a **server response** is server truth, and is the only legitimate source for the sync cursor. The same field read off of a **WatermelonDB row** is device-tainted: offline sends, Temp and Error sends, push-inserted rows, and `normalizeMessage`'s `_updatedAt || new Date()` fallback all stamp the device clock.

Therefore the **Last Open** must be taken from the raw payload _before_ `normalizeMessage` / `buildMessage` runs — never from a database row, and never from `Date.now()`.

| Term                 | Definition                                                                                                                   | Aliases to avoid       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Last Open**        | The fetch cursor for a Subscription (`lastOpen` column): the newest server `_updatedAt` actually received for that Room      | last open, last update |
| **Last Seen**        | The Subscription's read receipt (`ls`): the newest Message the user has read, which anchors the Unread Separator             | last read              |
| **Server Timestamp** | An `_updatedAt` taken from a server response — the only value the server can meaningfully compare a cursor against           | Timestamp (ambiguous)  |
| **Device Timestamp** | An `_updatedAt` present on a local row but written by the device clock; unusable as a cursor because the server never saw it | Timestamp (ambiguous)  |

A **Last Open** below a change's **Server Timestamp** only costs a re-fetch; one above it makes the server stay silent, and the change is never delivered. When in doubt, the lower cursor is the safe one.

A **Last Open** and a **Last Seen** are not interchangeable — conflating them (one column serving as both fetch cursor and unread anchor) is what produced permanently invisible Messages.

## Message Action & Position State

Two distinct kinds of transient per-Room state drive how the Room view renders Messages. Keep them apart.

| Term                     | Definition                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Message Action State** | The active Message Action in the Room (Quote, Edit, or React) and its target Message(s); null when none is active |
| **Positional State**     | Which Message is highlighted and the jump or scroll position                                                      |

### Message Actions

A **Message Action** is the active mode on a Message in the Room view. The three actions are **Quote**, **Edit**, and **React** — there is no "reply" action; replying in a Thread is a separate navigation, not a Message Action.

| Term      | Definition                                                                              | Aliases to avoid |
| --------- | --------------------------------------------------------------------------------------- | ---------------- |
| **Quote** | A Message Action where one or more Messages are selected to be quoted into the composer | Multi-quote      |
| **Edit**  | A Message Action where a single Message is being edited by the current user             | Editing          |
| **React** | A Message Action where a single Message is the target of a reaction picker              | Reacting         |

## Users & Roles

| Term            | Definition                                                                         | Aliases to avoid        |
| --------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| **User**        | An authenticated identity on the server with username, status, and roles           | Account, profile        |
| **Logged User** | The currently authenticated User session, holding auth token and preferences       | Current user, session   |
| **Role**        | A named permission group assigned to Users (e.g., owner, moderator, leader, guest) | Permission group        |
| **Permission**  | A named capability mapped to one or more Roles                                     | Privilege, access right |
| **Active User** | A User currently tracked as online/away/busy via real-time presence                | Online user             |
| **Member**      | A User viewed in the context of a specific Room's membership list                  | Participant             |

## User Status

| Term        | Definition                       | Aliases to avoid |
| ----------- | -------------------------------- | ---------------- |
| **Online**  | User is actively connected       | Active           |
| **Away**    | User idle past timeout threshold | Idle             |
| **Busy**    | User has set do-not-disturb      | DND              |
| **Offline** | User is not connected            | Disconnected     |

## Omnichannel / Livechat

| Term                   | Definition                                                                                           | Aliases to avoid             |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Omnichannel Room**   | A customer-service Room (type `'l'`) connecting a Visitor to an Agent                                | Livechat room, support chat  |
| **Visitor**            | An external customer who initiates an Omnichannel conversation, identified by a unique token         | Client, customer, end-user   |
| **Agent**              | A User designated to handle Omnichannel conversations, with `statusLivechat` (available/unavailable) | Support agent, operator, rep |
| **Inquiry**            | A queued Omnichannel request waiting to be picked up or routed to an Agent                           | Queue item, ticket           |
| **Department**         | An organizational unit that groups Agents for Omnichannel routing                                    | Team (ambiguous), group      |
| **Omnichannel Source** | How an Omnichannel conversation was initiated (widget, email, sms, app, api)                         | Channel origin               |
| **Served By**          | The Agent currently assigned to handle an Omnichannel Room                                           | Assigned agent, handler      |
| **On Hold**            | An Omnichannel Room temporarily paused by the Agent                                                  | Paused, suspended            |
| **Transfer**           | Moving an Omnichannel Room to a different Agent or Department                                        | Forward, reassign, handoff   |

## Encryption

| Term               | Definition                                                                                                             | Aliases to avoid |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **E2E Encryption** | End-to-end encryption for Room content using AES-SHA2, with two protocol versions (`rc.v1.aes-sha2`, `rc.v2.aes-sha2`) | Encryption, E2EE |
| **E2E Key**        | A user's asymmetric key pair (public + private) for E2E Encryption                                                     | Crypto key       |
| **OTR**            | Off-The-Record messaging — ephemeral encrypted conversation mode between two users                                     | —                |

## Video & Voice

| Term                        | Definition                                                                                                                                                                                                | Aliases to avoid               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Video Conference**        | A video/voice call session with status lifecycle (calling, started, expired, ended, declined)                                                                                                             | Video call, meeting            |
| **Direct Video Conference** | A 1-on-1 Video Conference                                                                                                                                                                                 | —                              |
| **Group Video Conference**  | A multi-participant Video Conference with title and anonymous user support                                                                                                                                | —                              |
| **VOIP**                    | Voice-over-IP phone-style call, separate from Video Conference — uses ICE servers and media streams                                                                                                       | Phone call, voice call         |
| **Native Accept**           | An incoming VOIP call answered by native code (CallKit on iOS, Telecom on Android) before the JS runtime is available; native issues the REST accept and JS reconciles state on launch via initial events | JS accept, app accept          |
| **Per-call DDP**            | A short-lived DDP client opened by native code per incoming VOIP call so accept and signaling land before JS boots; separate from the main app DDP session                                                | Native socket, side socket     |
| **Media Signal**            | A typed event on the `@rocket.chat/media-signaling` wire protocol (offer, answer, ICE candidate, state update) carried over DDP `stream-notify-user` and replayable via REST `media-calls.stateSignals`   | Signal, RTC event              |
| **Pending Hangup**          | A VOIP call id recorded in-memory when the user taps End while the WebSocket is unhealthy, so the hangup Media Signal can be replayed through the lib's transporter on the next post-login reconnect      | Hangup intent, deferred hangup |

## Server & Connection

| Term               | Definition                                                                                        | Aliases to avoid                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Server**         | A Rocket.Chat server instance the app connects to, with version, settings, and enterprise modules | Workspace (used by web but not consistently in mobile), instance |
| **Server History** | List of previously connected Servers for quick reconnection                                       | Recent servers                                                   |
| **Meteor Connect** | The WebSocket connection to the Server's DDP (Distributed Data Protocol) endpoint                 | Socket, connection                                               |

## Navigation & Layout

| Term                 | Definition                                                                                | Aliases to avoid       |
| -------------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| **Outside Stack**    | Navigation screens shown when unauthenticated (server selection, login, register)         | Auth stack, login flow |
| **Inside Stack**     | Navigation screens shown when authenticated (rooms, settings, profile)                    | Main stack, app stack  |
| **Master-Detail**    | Tablet layout with room list (master pane) and room content (detail pane) side by side    | Split view, two-pane   |
| **Chats Stack**      | The primary messaging navigation within Inside Stack (room list, room view, room actions) | —                      |
| **Drawer Navigator** | Side navigation containing tabs: Chats, Profile, Settings, Admin, Accessibility           | Sidebar, menu          |

## Unread & Notification Indicators

| Term               | Definition                                                                                               | Aliases to avoid  |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ----------------- |
| **Unread**         | Count of unread regular Messages in a Subscription                                                       | Badge count       |
| **User Mentions**  | Count of Messages that `@mentioned` the current user in a Subscription                                   | Personal mentions |
| **Group Mentions** | Count of `@all` or `@here` mentions in a Subscription                                                    | Channel mentions  |
| **Tunread**        | Array of Thread IDs with unread replies                                                                  | Thread unread     |
| **Alert**          | Boolean flag on a Subscription indicating it has unread mentions or special activity requiring attention | Notification flag |

## Relationships

- A **Room** can be of type **Channel**, **Group**, **Direct Message**, or **Omnichannel Room**
- A **Subscription** belongs to exactly one **Room** and one **User**
- A **Message** belongs to exactly one **Room** (via `rid`)
- A **Thread** is spawned from exactly one **Thread Parent** and contains one or more **Thread Messages** that reference it via `tmid`
- A **Discussion** creates a new **Room** linked to a parent **Room** (via `prid`); a **Discussion-Created Message** in the parent records the spawning
- A **Team** has exactly one main **Room** and can contain multiple **Channels**
- An **Omnichannel Room** connects exactly one **Visitor** with zero or one **Agents** (via **Served By**)
- An **Agent** belongs to one or more **Departments**
- An **Inquiry** becomes an **Omnichannel Room** when picked up by an **Agent**
- A **Broadcast Room** restricts sending to authorized users; others interact via **Reply Broadcast**
- An **Ignored Message** is a **Message** whose author is an **Ignored User** in the current **Room**; revealing it is per-Message and ephemeral
- A **Call Message** records a **Video Conference** and offers a join affordance
- A **Room** view shows a **Live Window** by default; a **Jump to Message** replaces it with an **Anchored Window**
- A **Gap** is bracketed by **Loader Rows**; resolving a Loader Row fetches a **Chunk** and may shrink or close the Gap
- **Jump to Message** fetches a **Chunk** centered on the target (`loadSurroundingMessages`), bracketed by an **Older Loader** and a **Newer Loader** when more Messages exist on either side

## Example dialogue

> **Dev:** "When a user opens the app, do they see their **Subscriptions** or their **Rooms**?"
> **Domain expert:** "**Subscriptions**. The sidebar shows the user's Subscriptions — each one points to a Room, but carries user-specific state like **Unread** count and **Alert** flag. A Room exists independently; a Subscription is the user's window into it."
> **Dev:** "So if someone starts a **Thread** in a **Channel**, does that create a new **Subscription**?"
> **Domain expert:** "No. A **Thread** lives inside the parent Room's **Subscription**. Thread unreads are tracked via **Tunread** on the Subscription. A **Discussion**, on the other hand, creates an entirely new Room with its own Subscription."
> **Dev:** "And for **Omnichannel** — when a **Visitor** sends a message from the widget, what happens?"
> **Domain expert:** "An **Inquiry** is created and queued. Once an **Agent** picks it up or routing assigns it, the Inquiry becomes an **Omnichannel Room** with the Agent recorded in **Served By**. If the Agent needs to escalate, they do a **Transfer** to another Agent or **Department**."

## Flagged ambiguities

- **"Workspace"** is used by Rocket.Chat web to mean a server instance, but the mobile codebase uses **Server**. Use **Server** in mobile context to avoid confusion with the web admin concept.
- **"Room type `'e2e'`"** and **"Room type `'thread'`"** appear in `SubscriptionType` enum but are marked with FIXME in code — these are not true room types but flags. Do not treat them as room types in new code.
- **"Account"** is sometimes used loosely to mean either **User** (the identity) or **Server** (the connected instance). These are distinct: a **User** authenticates on a **Server**.
- **"Channel"** in everyday speech can mean any Room, but in domain terms it strictly means a public Room (type `'c'`). A private Room is a **Group** (type `'p'`).
- **"Forward"** in omnichannel context means **Transfer** (reassigning a room to another agent/department). The codebase uses both `forwardRoom` and "transfer" — prefer **Transfer** as the domain term.
- **"History"** is overloaded: **Server History** is the recent-Servers reconnection list; **Room History** is older Messages fetched on demand. The action `roomHistoryRequest` and saga `ROOM.HISTORY_REQUEST` refer to **Room History**.
- **"Window"** is used metaphorically in the Subscriptions dialogue ("a Subscription is the user's window into it"); a **Message Window** is the concrete observed Message range in the Room view. Disambiguate when both could be meant.
- **"`lastOpen`"** names a database column, not a concept: it stores the **Last Open**, a server-clock fetch cursor. It has never meant "when the user last opened the room". The Unread Separator anchor is **Last Seen** (`ls`). Do not read `lastOpen` as a read receipt or write a device clock into it.
- **"Load more"** is directional: older Messages are an **Older Loader** (`MORE`/`PREVIOUS_CHUNK`), newer Messages are a **Newer Loader** (`NEXT_CHUNK`). Avoid bare "load more".
- **"System message" vs "Info message"** — **System Message** is the umbrella (any `t`-bearing server Message); **Info Message** is the narrower set of room-event System Messages. The typed events `e2e`, `discussion-created`, `jitsi_call_started`, and `videoconf` are System Messages but NOT Info Messages — each gets its own rendering branch.
- **"Thread reply"** is overloaded. The glossary's **Thread Message** is the data concept (any Message with `tmid`); the code's `isThreadReply` is a _rendering position_ — the first Thread Message in a run shown in the parent Room, which gets the "in reply to" header. Do not use "thread reply" for the data concept.
- **"Preview"** is overloaded. **Message Preview** (`isPreview`) is a Message rendered outside its Room (search, pinned, share, notifications). `PreviewContent` is a different concept: the compact body of a Thread Message shown in the parent Room. Disambiguate when either could be meant.
- **"Muted"** is overloaded: a User can be muted in a Room (a moderator action that removes send permission, recorded by `user-muted`/`mute_unmute` System Messages) OR be an **Ignored User** (a per-viewer filter that hides their Messages behind an Ignored Message placeholder, stored in `room.ignored`). Muting is a room permission; ignoring is a personal filter. Different concepts — keep them apart.
- **"Reply"** is overloaded: **Reply Broadcast** is the action available to non-authorized users in a Broadcast Room; replying in a **Thread** is navigation into the Thread view. Neither is a **Message Action** — there is no "reply" Message Action.
- **"Status" vs "flags"** — a Message has exactly one delivery **Status** (Sent, Temp, Error). **Pinned** and **Starred** are independent **Message Flags**, not statuses; do not group them with delivery states.
- **"Interaction" retired** — the selection-plus-action state was once an "interaction" concept; the canonical term is now **Message Action State**. Use **Message Action**, not "interaction", for which Message is selected and how. (Selection is not separate — it lives inside the active Message Action.)
