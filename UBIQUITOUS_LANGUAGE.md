# Ubiquitous Language

## Rooms & Conversations

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Room** | A conversation space identified by `rid`, with a type (`t`) determining its behavior | Chat, conversation, chat room |
| **Channel** | A public room (`t='c'`) discoverable by all server users | Public group, open room |
| **Group** | A private room (`t='p'`) accessible only to invited members | Private channel, private room |
| **Direct** | A one-on-one or multi-party direct message room (`t='d'`) | DM, IM, instant message, private message |
| **Discussion** | A child room linked to a parent via `prid`, created from a message | Sub-room, nested channel |
| **Subscription** | A user's participation record in a room — tracks unread counts, favorites, drafts, and per-user state | Membership, room membership, joined room |
| **Broadcast** | A room mode where only admins can post; others can only react or reply in threads | Announcement channel, read-only channel |

## Messages

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Message** | A content unit within a room, identified by `_id`, belonging to a room via `rid` | Chat message, text |
| **System Message** | A message with a type code (`t`) representing an automated event (user join, topic change, etc.) | Event, notification message, auto-message |
| **Thread** | A reply chain spawned from a parent message, linked via `tmid` (thread message ID) | Reply chain, conversation thread |
| **Thread Message** | An individual message within a thread, tracked separately with `subscription_id` | Reply, threaded reply |
| **Attachment** | Media or rich content embedded in a message — images, videos, audio, files, or nested cards | File, media, embed |
| **Reaction** | An emoji response on a message, storing the emoji and list of usernames who reacted | Emoji reaction, like |
| **Mention** | A reference to a user or channel within message text, parsed into structured data | Tag, @mention, ping |
| **Block** | A UIKit interactive element rendered within a message (buttons, selects, overflow menus) | UI block, interactive element, action block |
| **Markdown** (`md`) | The parsed markdown AST of a message, stored alongside raw `msg` text | Parsed message, rich text |

## Users & Identity

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **User** | An authenticated identity on a Rocket.Chat server, with `username`, `name`, and `status` | Account, member, person |
| **Logged User** | The currently authenticated user in the active session, carrying `token` and preferences | Current user, session user, me |
| **Status** | A user's availability state: `online`, `away`, `busy`, `offline`, or `disabled` | Presence, availability |
| **Role** | A named capability set assigned to a user at global (`Users`) or room (`Subscriptions`) scope | Permission group, access level |
| **Permission** | A specific action right (e.g., `create-c`) mapped to one or more roles | Privilege, access right, capability |

## Teams

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Team** | A named group of rooms and members, typed as `PUBLIC` (0) or `PRIVATE` (1) | Team channel, workspace |
| **Team Member** | A user's membership in a team, with team-specific roles | Team participant, team user |
| **Team Room** | A room belonging to a team, linked via `teamId`; the main room has `team_main=true` | Team channel |

## Omnichannel

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Omnichannel Room** | A room (`t='l'`) representing a customer support conversation from an external source | Livechat room, livechat, support chat |
| **Visitor** | An external customer initiating an omnichannel conversation, identified by `token` | Customer, client, livechat user, guest |
| **Agent** | A server user handling omnichannel conversations, with `statusLivechat` (available/unavailable) | Support agent, operator, representative |
| **Department** | An organizational unit grouping agents for omnichannel routing | Support team, queue, livechat department |
| **Inquiry** | A queued omnichannel conversation awaiting agent assignment | Queue item, pending chat, waiting conversation |
| **Canned Response** | A pre-written reply template with a `shortcut` trigger, scoped to user/department/global | Quick reply, saved response, macro |
| **Tag** | A label applied to omnichannel conversations for categorization and reporting | Livechat tag, label, category |
| **Source** | The origin of an omnichannel conversation: `widget`, `email`, `sms`, `app`, `api`, or `other` | Channel, origin, entry point |

## End-to-End Encryption (E2E)

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **E2E Encryption** | Client-side encryption of message content so only room participants can decrypt | Encryption, end-to-end, E2EE |
| **E2E Key** (`E2EKey`) | The per-subscription group encryption key used to encrypt/decrypt room messages | Encryption key, room key, group key |
| **E2E Key ID** (`e2eKeyId`) | Identifier for the current encryption key version on a room | Key version, key identifier |
| **E2E Status** | Message encryption state: `pending` (not yet encrypted/decrypted) or `done` | Encryption status |
| **Encrypted Content** | The ciphertext payload stored in a message's `content` field, versioned as `rc.v1.aes-sha2` or `rc.v2.aes-sha2` | Cipher, encrypted message, encrypted payload |
| **Suggested Key** (`E2ESuggestedKey`) | A group key proposed to a user who wasn't present when the original key was distributed | Pending key, offered key |

## Video Conferencing

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Video Conference** | A real-time audio/video call session within a room, with status lifecycle: CALLING, STARTED, EXPIRED, ENDED, DECLINED | Video call, meeting, conference call |
| **Direct Call** | A 1:1 video conference between two users | Personal call, private call |
| **Group Call** | A multi-participant video conference in a room | Conference, group video |
| **Ringer** | The audio/UI component that plays when an incoming call is received | Call alert, ring, incoming call notification |

## Server & Connection

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Server** | A Rocket.Chat instance the app connects to, identified by URL | Workspace, instance, host |
| **Server History** | A record of previously connected server URLs with associated usernames | Login history, saved servers |
| **Meteor Connect** | The DDP (Distributed Data Protocol) real-time connection to the server | WebSocket connection, real-time connection, DDP |
| **Enterprise Module** | A feature flag indicating availability of a paid/enterprise capability | License feature, premium module |
| **Supported Versions** | Server-declared compatible app version ranges, triggering warnings when outdated | Version compatibility, version check |

## File & Media

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Upload** | A file being sent to a room, tracked with `progress` (0-100) and `error` state | File upload, attachment upload |
| **Custom Emoji** | A server-defined emoji with `name` and file `extension`, distinct from Unicode emoji | Server emoji, uploaded emoji |
| **Frequently Used Emoji** | A per-user emoji usage counter for emoji picker ordering | Recent emoji, emoji history |
| **URL Preview** | Rich metadata (OG image, title, description) extracted from links shared in messages | Link preview, unfurl, embed |

## Navigation & Deep Linking

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Deep Link** | A URL that routes the app to a specific room, message, or action | Universal link, app link |
| **Spotlight** | The quick-search feature returning matched users and rooms | Quick search, global search, jump-to |
| **Directory** | The browsable listing of all public channels and users on a server | Channel list, user directory |

## Authentication

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Credentials** | Login payload supporting multiple methods: password, LDAP, SAML, CAS, OAuth, resume token | Login data, auth payload |
| **Two-Factor Authentication** (2FA) | Secondary verification via TOTP code or email code during login | MFA, second factor, verification code |
| **Resume Token** | A stored token allowing session restoration without re-entering credentials | Session token, refresh token, auth token |
| **Login Services** | External OAuth/SSO providers configured on the server (Google, GitHub, SAML, CAS, etc.) | OAuth providers, SSO, external auth |

## App State & UI

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Master Detail** | The split-view layout on tablets showing room list and room content side-by-side | Split view, tablet layout, two-pane |
| **Sort Preferences** | User settings for room list ordering: `sortBy`, `groupByType`, `showFavorites`, `showUnread`, `displayMode` | List preferences, view settings |
| **Share Extension** | The OS-level share sheet integration that sends content from other apps into Rocket.Chat | Share sheet, sharing |
| **In-App Notification** | A banner shown inside the app when a push notification arrives while the app is foregrounded | Toast, notification banner |
| **Slash Command** | A `/`-prefixed command that triggers server-side or client-side actions | Command, bot command |

## Accessibility (a11y)

| Term | Definition | Aliases to avoid |
|------|-----------|-----------------|
| **Accessibility Label** (`accessibilityLabel`) | A human-readable string announced by screen readers to describe an element | aria-label, alt text |
| **Accessibility Role** (`accessibilityRole`) | Semantic role of a component (`button`, `header`, `switch`, etc.) that tells screen readers how to treat the element | aria-role |
| **Accessibility Elements Hidden** (`accessibilityElementsHidden`) | Hides a subtree from the screen reader while keeping it visually mounted — used on containers that animate in/out | aria-hidden |
| **A11y Order** | Reading order control via `react-native-a11y-order` (`A11y.Order` / `A11y.Index`) — applied when visual layout order differs from logical reading order | Tab order, focus order |
| **Accessibility Focus** | Programmatic focus placement via `AccessibilityInfo.setAccessibilityFocus()` — used to guide screen reader to the most important element on screen (e.g., incoming call) | Focus management |
| **Screen Reader Announcement** | A message pushed to the screen reader via `AccessibilityInfo.announceForAccessibility()` without changing focus — used for dynamic state changes | Live region, aria-live |
| **Font Scale** (`fontScale`) | OS-level text size multiplier (1.0 = default). Exposed by `useResponsiveLayout()`. React Native `Text` respects it automatically | Text size, dynamic type |
| **Font Scale Limited** (`fontScaleLimited`) | `fontScale` capped at `FONT_SCALE_LIMIT = 1.3` via `useResponsiveLayout()` — applied only to fixed-size containers where uncapped scaling breaks layout | Capped font scale |
| **Screen Reader Enabled** | Runtime boolean from `useIsScreenReaderEnabled()` indicating VoiceOver (iOS) or TalkBack (Android) is active — used to adapt gesture-based interactions | VoiceOver active, TalkBack active |

## Relationships

- A **User** has many **Subscriptions**, each linking them to one **Room**
- A **Room** contains many **Messages**; a **Message** belongs to one **Room** (via `rid`)
- A **Message** can spawn a **Thread** (via `tmid`); a **Thread** contains **Thread Messages**
- A **Message** can create a **Discussion**, which is itself a child **Room** (linked via `prid`)
- A **Room** can belong to a **Team** (via `teamId`); a **Team** has one main **Room** (`team_main=true`)
- An **Omnichannel Room** is served by an **Agent**, belongs to a **Department**, and is initiated by a **Visitor**
- An **Inquiry** becomes an **Omnichannel Room** once an **Agent** accepts it
- A **Permission** maps to one or more **Roles**; a **Role** is scoped to either `Users` (global) or `Subscriptions` (per-room)
- An **E2E Key** is stored per **Subscription**, encrypting all **Messages** in that **Room**
- A **Video Conference** belongs to a **Room** and tracks participating **Users**
- A **Custom Emoji** is server-wide; a **Frequently Used Emoji** is per-user

## Example dialogue

> **Dev:** "When a user opens the app, how do we know which rooms to show?"
> **Domain expert:** "We load all **Subscriptions** for the **Logged User** from WatermelonDB. Each **Subscription** points to a **Room** via `rid`. The list is ordered by **Sort Preferences**."
> **Dev:** "What about **Omnichannel Rooms** — do agents see those the same way?"
> **Domain expert:** "No. Omnichannel conversations first appear as **Inquiries** in a queue. The **Agent** must accept the **Inquiry**, which creates a **Subscription** and makes the **Omnichannel Room** visible in their list."
> **Dev:** "And if a customer sends a message before an agent accepts?"
> **Domain expert:** "The **Visitor**'s messages are stored in the **Omnichannel Room**, but no **Agent** has a **Subscription** to it yet. The **Inquiry** tracks queue position. Once accepted, the **Agent** gets the full **Message** history."
> **Dev:** "What about encrypted rooms — does the **Subscription** carry the key?"
> **Domain expert:** "Yes. The **E2E Key** is stored on the **Subscription**. When a new user joins, we use **Suggested Key** to propose the group key. Until they accept, their **E2E Status** on messages stays `pending`."

## Flagged ambiguities

- **`rid`** vs **`_id`** vs **`id`**: All three appear as room identifiers. `rid` is the canonical room reference on Subscriptions and Messages. `_id` is the document ID (often equals `rid` on rooms). `id` appears on WatermelonDB models as the local primary key. Use **`rid`** when referring to a room relationship, **`_id`** for the room document itself.
- **`t` (type)** is overloaded across domains: on Rooms/Subscriptions it's the room type (`c`/`d`/`p`/`l`), on Messages it's the system message type (`uj`/`ul`/`au`/etc.). Always qualify: "room type" or "message type."
- **"Livechat"** vs **"Omnichannel"**: The codebase uses both — `livechat` in API endpoints and database fields, `omnichannel` in types, UI, and enterprise modules. **Omnichannel** is the canonical term; **Livechat** is a legacy alias persisting in API/DB layers.
- **`fname`** vs **`name`**: Rooms have both — `name` is the slug/identifier, `fname` is the display-friendly formatted name. Use **`fname`** for display, **`name`** for lookups.
- **"Group"** vs **"Private Channel"**: The codebase maps `t='p'` to `ERoomType.p = 'group'`. The canonical term is **Group**; avoid "private channel."
- **`tmsg`** is used for both "translated message" and "thread message text" depending on context. On IMessage it holds the thread's root message text for display; on translations it holds the translated content.
- **"User" model** exists in both the app database (room participants) and servers database (logged-in user profile). The app-DB User is a lightweight participant record; the servers-DB User carries authentication tokens and preferences.
