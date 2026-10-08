# Ubiquitous Language

Each entry: **Term**: definition. _Avoid:_ words not to use for it.

## Rooms & Conversations

- **Room**: server-side conversation container with shared state (name, type, settings). _Avoid:_ Chat, conversation
- **Subscription**: a user's relationship to a Room, holding per-user state (unread count, favorite, muted, open); never a **DDP Subscription**. _Avoid:_ Membership, room entry
- **Room Membership**: exactly one of:
  - **Subscribed Room**: Subscription exists, status not `invited`. _Avoid:_ Joined room
  - **Invited**: Subscription exists, status `invited`, not yet accepted
  - **Preview Mode**: no Subscription; Room data comes from navigation params or a REST lookup; lasts until the user joins
  - _Avoid:_ Joined flag, membership
- **Channel**: public Room (type `'c'`). _Avoid:_ Public room
- **Group**: private Room (type `'p'`), invited members only. _Avoid:_ Private room, private channel
- **Direct Message**: 1-on-1 private Room (type `'d'`). _Avoid:_ DM, PM, private message
- **Thread**: branched conversation spawned from one Message, identified by `tmid`. _Avoid:_ Reply chain
- **Discussion**: a full Room spawned from a parent Room, identified by `prid`. _Avoid:_ Sub-room, sub-channel
- **Team**: groups Channels and users; has one main Room. _Avoid:_ Workspace (a different thing)
- **Broadcast Room**: only authorized users send; others can only **Reply Broadcast** (reply to an existing Message). _Avoid:_ Broadcast channel / Broadcast reply

## Messages

- **Message**: unit of communication in a Room (`rid`); `_id`, content in `msg`, parsed markdown in `md`. _Avoid:_ Chat message, text
- **Thread Message**: Message with `tmid`. _Avoid:_ Reply, thread reply
- **Thread Parent**: the Message its Thread Messages' `tmid` points at. _Avoid:_ Thread root, parent message
- **Attachment**: media or structured data in a Message (image, video, audio, file, action buttons). _Avoid:_ File, media
- **Reaction**: emoji response tracking which usernames reacted. _Avoid:_ Emoji reaction
- **Mention**: `@username` reference that triggers notifications. _Avoid:_ Tag, ping
- **Draft Message**: unsent composition on a Subscription or Thread (`draftMessage`). _Avoid:_ Unsent message
- **Snippet**: saved excerpt from a Message

### System Messages

Server-generated Messages carrying a `t` type field. Room-event and typed-event System Messages are separate rendering branches.

- **System Message**: umbrella for any `t`-bearing Message. _Avoid:_ Event, notification
- **Info Message**: room event (joined, archived, role changed, muted), compact and non-interactive. Excludes the typed events below. _Avoid:_ System event, event message
- **Discussion-Created Message**: `t = 'discussion-created'`; links to the new Discussion Room
- **Call Message**: `t = 'jitsi_call_started'` or `t = 'videoconf'`; records a Video Conference with a join affordance. _Avoid:_ Video call message
- **Encrypted Message**: `t = 'e2e'`, pending decryption (`e2e !== 'done'`); "Encrypted message" placeholder. _Avoid:_ Pending E2E message

### Content & Visibility States

- **Ignored User**: User the current user hid in one Room (`room.ignored`). _Avoid:_ Muted user
- **Ignored Message**: Message by an Ignored User; "Message ignored" placeholder, revealed per-Message and ephemerally on tap. _Avoid:_ Muted message
- **Auto-Translate**: per-Room setting translating other users' Messages. _Avoid:_ Live translate
- **Translated Message**: Message shown via its auto-translated text. _Avoid:_ Auto-translated message
- **Blocks Message**: body is Blocks from a Rocket.Chat App, rendered instead of markdown. _Avoid:_ App message
- **Message Preview**: Message rendered outside its Room (search, pinned, share extension, notifications); no interactions, reactions, or thread context. _Avoid:_ Preview row

## Message Grouping

- **Message Header**: author block (avatar, name, timestamp) on the first Message of a run. _Avoid:_ Title, byline
- **Grouped Message**: continues a same-author run within the Grouping Period, no Header. _Avoid:_ Sequential, collapsed
- **Grouping Period**: max gap for same-author Messages to share a Header (`Message_GroupingPeriod`)
- **Previous Message**: the adjacent older Message; a Message's Header is derived from it (author, time, status, thread). _Avoid:_ Prior message, neighbor

## Message Status & Flags

**Status** (`status`) is the delivery lifecycle, exactly one at a time: **Sent** (`0`, _avoid_ Delivered), **Temp** (`1`, local, unconfirmed; _avoid_ Pending, sending), **Error** (`2`; _avoid_ Failed).

**Message Flags** are independent of Status and of each other:

- **Pinned**: important for the whole Room, in the pinned list. _Avoid:_ Bookmarked
- **Starred**: personal bookmark, visible only to that user. _Avoid:_ Saved

## Message Separators

- **Date Separator**: inline divider between Messages on different days. _Avoid:_ Date divider
- **Floating Date Separator**: overlay with the topmost visible Message's date while scrolling. _Avoid:_ Sticky date
- **Unread Separator**: between last read and first unread Message, anchored by **Last Seen**. _Avoid:_ Unread divider

## Message Loading

- **Message Window**: the range of Messages the Room view observes and renders (not what is synced). _Avoid:_ Page, feed
- **Live Tail**: newest end of a Room's Messages. _Avoid:_ Bottom, latest
- **Live Window**: Message Window ending at the Live Tail; the default; follows new Messages
- **Anchored Window**: Message Window around a Jump to Message target; does not follow new Messages
- **Chunk**: contiguous run of Messages synced locally, bracketed by Loader Rows where more exists. _Avoid:_ Batch, page
- **Gap**: Messages on the server but not local, between Chunks; marked by a Loader Row. _Avoid:_ Hole
- **Loader Row**: placeholder Message record marking a Gap; visible → server fetch. _Avoid:_ Load-more, spinner row
- **Older Loader**: types `MORE`, `PREVIOUS_CHUNK`. _Avoid:_ Load previous
- **Newer Loader**: type `NEXT_CHUNK`. _Avoid:_ Load next
- **Room History**: older Messages fetched on demand (`roomHistoryRequest`, `ROOM.HISTORY_REQUEST`). _Avoid:_ Message history
- **Jump to Message**: re-position the Room view onto a target Message, fetching a surrounding Chunk (`loadSurroundingMessages`) bracketed by Older/Newer Loaders. _Avoid:_ Scroll to message

## Timestamp Trust Boundary

- **Server Timestamp**: `_updatedAt` from a server response. _Avoid:_ Timestamp (ambiguous)
- **Device Timestamp**: `_updatedAt` on a WatermelonDB row written by the device clock (offline/Temp/Error sends, push-inserted rows, `normalizeMessage`'s `_updatedAt || new Date()` fallback). Never a cursor. _Avoid:_ Timestamp (ambiguous)
- **Last Open**: Subscription fetch cursor (`lastOpen` column), the newest Server Timestamp received for the Room. Take it from the raw payload before `normalizeMessage` / `buildMessage`; never from a database row or `Date.now()`. _Avoid:_ last open, last update
- **Last Seen**: read receipt (`ls`). _Avoid:_ last read

A Last Open too low costs a re-fetch; too high and the server never delivers the change. Prefer the lower cursor. Using one column as both Last Open and Last Seen produced permanently invisible Messages.

## Message Action & Position State

- **Message Action State**: the active Message Action and its target Message(s), or null. Owner: per-Room MessageActionStore; scope: that Room's Message rows and composer
- **Message Action**: exactly **Quote** (one or more Messages into the composer; _avoid_ Multi-quote), **Edit** (one own Message; _avoid_ Editing), or **React** (one Message, reaction picker; _avoid_ Reacting). Selection lives inside it. Replying is not a Message Action
- **Positional State**: highlighted Message plus jump/scroll position, split across:
  - **Jump orchestration**: decide, resolve anchor, request. Owner: RoomView (`useJumpToMessage`)
  - **Scroll and highlight execution**: scroll and render highlight. Owner: the List component

## Emojis

Reactions and the frequently used table store emoji by name, never glyph. An unresolvable name renders as literal `:shortname:`, so names are only ever added to the resolvable set. Dataset generation: [emojis](docs/emojis.md).

- **Shortname**: colon-wrapped `:name:` in Message text and a Reaction's `emoji`; the only form `useShortnameToUnicode` resolves. _Avoid:_ Emoji code, emoji id
- **Listed Name**: the one Shortname per listed emoji the picker shows (`emojisByCategory`) and search returns. _Avoid:_ Canonical name, primary
- **Alias**: another Shortname for the same emoji; searchable, answered with the Listed Name (`water_wave` finds `ocean`). _Avoid:_ Synonym, alternate name
- **Legacy Shortname**: hand-maintained, absent from the dataset, resolved by fallback for older clients. _Avoid:_ Deprecated name, old name
- **Pinned Shortname**: held at a previous release's glyph at generation time (`scripts/pinned-shortnames.js`) when upstream reassigns it. _Avoid:_ Override, frozen name
- **Custom Emoji**: Workspace-uploaded image, stored by name plus extension. _Avoid:_ Custom reaction, sticker

## Users & Roles

- **User**: server identity with username, status, roles. _Avoid:_ Account, profile
- **Logged User**: current session, auth token, preferences. _Avoid:_ Current user, session
- **Role**: named permission group (owner, moderator, leader, guest). _Avoid:_ Permission group
- **Permission**: named capability mapped to Roles. _Avoid:_ Privilege, access right
- **Active User**: tracked via real-time presence. _Avoid:_ Online user
- **Member**: User in a Room's membership list. _Avoid:_ Participant
- **User Status**: **Online** (_avoid_ Active), **Away** (idle; _avoid_ Idle), **Busy** (do-not-disturb; _avoid_ DND), **Offline** (_avoid_ Disconnected)

## Omnichannel / Livechat

- **Omnichannel Room**: type `'l'`, one Visitor with zero or one Agent. _Avoid:_ Livechat room, support chat
- **Visitor**: external customer, identified by token. _Avoid:_ Client, customer, end-user
- **Agent**: User handling Omnichannel, with `statusLivechat`; belongs to Departments. _Avoid:_ Support agent, operator, rep
- **Inquiry**: queued request; becomes an Omnichannel Room when picked up. _Avoid:_ Queue item, ticket
- **Department**: groups Agents for routing. _Avoid:_ Team (ambiguous), group
- **Omnichannel Source**: widget, email, sms, app, api. _Avoid:_ Channel origin
- **Served By**: the assigned Agent. _Avoid:_ Assigned agent, handler
- **On Hold**: paused by the Agent. _Avoid:_ Paused, suspended
- **Transfer**: move to another Agent or Department (code also says `forwardRoom`). _Avoid:_ Forward, reassign, handoff
- **Routing Config**: per-server settings for Return to Queue and Inquiry visibility. _Avoid:_ Livechat config, routing settings
- **Return to Queue**: Agent hands the Room back as an Inquiry. _Avoid:_ Return inquiry, release chat

## Encryption

- **E2E Encryption**: AES-SHA2, versions `rc.v1.aes-sha2`, `rc.v2.aes-sha2`. _Avoid:_ Encryption, E2EE
- **E2E Key**: user's public/private key pair. _Avoid:_ Crypto key
- **OTR**: Off-The-Record ephemeral two-user mode

## Video & Voice

- **Video Conference**: call with status calling/started/expired/ended/declined; **Direct Video Conference** (1-on-1) or **Group Video Conference** (title, anonymous users). _Avoid:_ Video call, meeting
- **VOIP**: phone-style call, separate from Video Conference (ICE servers, media streams). _Avoid:_ Phone call, voice call
- **Native Accept**: incoming VOIP answered by CallKit (iOS) / Telecom (Android) before JS; native sends the REST accept, JS reconciles on launch via initial events. _Avoid:_ JS accept, app accept
- **Per-call DDP**: short-lived native DDP client per incoming VOIP call, separate from the app DDP session. _Avoid:_ Native socket, side socket
- **Media Signal**: typed event of `@rocket.chat/media-signaling` (offer, answer, ICE candidate, state update) over DDP `stream-notify-user`, replayable via REST `media-calls.stateSignals`. _Avoid:_ Signal, RTC event
- **Pending Hangup**: in-memory call id recorded when End is tapped on an unhealthy WebSocket; the hangup Media Signal replays through the lib's transporter on the next post-login reconnect. _Avoid:_ Hangup intent, deferred hangup

## Workspace & Connection

- **Workspace**: a Rocket.Chat deployment (version, settings, enterprise modules). _Avoid:_ Server (legacy), instance
- **Workspace History**: previously connected Workspaces. _Avoid:_ Recent servers
- **Meteor Connect**: WebSocket to the Workspace's DDP endpoint. _Avoid:_ Socket, connection
- **Socket Health**: whether that socket is alive; round trip when in doubt, reopen when dead. _Avoid:_ Staleness (stale/gray/fresh), socket probe
- **DDP Subscription**: server-push feed opened by name and params (`stream-room-messages`, `stream-notify-user`); the SDK derives its id from them, so identical requests share one. _Avoid:_ Stream, DDP stream, sub

## Navigation & Layout

- **Outside Stack**: unauthenticated screens. _Avoid:_ Auth stack, login flow
- **Inside Stack**: authenticated screens. _Avoid:_ Main stack, app stack
- **Chats Stack**: room list, room view, room actions within Inside Stack
- **Master-Detail**: tablet two-pane layout. _Avoid:_ Split view, two-pane
- **Drawer Navigator**: tabs Chats, Profile, Settings, Admin, Accessibility. _Avoid:_ Sidebar, menu

## Unread & Notification Indicators

Subscription fields: **Unread** (count; _avoid_ Badge count), **User Mentions** (`@mentioned` me; _avoid_ Personal mentions), **Group Mentions** (`@all`/`@here`; _avoid_ Channel mentions), **Tunread** (Thread IDs with unread replies; _avoid_ Thread unread), **Alert** (unread mentions or activity; _avoid_ Notification flag).

## Flagged ambiguities

- **Server**: legacy name for Workspace, still in code (`server`, `serversHistory`, `selectServer`). Use Workspace in prose, new names, and copy; renaming is a migration. "Server" as the remote side (_server response_, _server clock_) stays valid.
- **Room types `'e2e'` and `'thread'`** in the `SubscriptionType` enum are FIXME-marked flags, not room types.
- **Account**: means a User, which authenticates on a Workspace.
- **Channel** strictly means type `'c'`.
- **History**: Workspace History vs Room History.
- **Window**: Message Window is the concrete Message range.
- **`lastOpen`**: the Last Open cursor, never "when the user last opened the room" and never a read receipt.
- **Load more**: say Older Loader or Newer Loader.
- **Thread reply**: `isThreadReply` is a rendering position (first Thread Message of a run shown in the parent Room, with the "in reply to" header); the data concept is Thread Message.
- **Preview**: Message Preview (`isPreview`) vs `PreviewContent` (compact Thread Message body in the parent Room).
- **Muted**: a moderator mute removes send permission (`user-muted`/`mute_unmute` System Messages); an Ignored User is a personal filter.
- **Reply**: Reply Broadcast or Thread navigation; neither is a Message Action.
- **Shortname forms**: in-app APIs pass the bare name (`IEmoji`, `emojisByCategory` and `aliasesByEmojiName` keys, `DEFAULT_EMOJIS`, `searchEmojiNames`, the frequently used table's `content`, the name `setReaction` sends). Message text, a Reaction's `emoji`, and `shortnameToUnicodeMap` keys are colon-wrapped. `formatShortnameToUnicode` matches only colon-wrapped: wrap bare names before resolving, strip stored ones before name lookup.
- **Pinned**: Message Flag vs Pinned Shortname; unrelated.
- **Alias**: an emoji Alias is a valid term, unlike the _Avoid_ lists.
- **Interaction**: retired; say Message Action State.
