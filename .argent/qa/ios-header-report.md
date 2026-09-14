# iOS branch QA — 2026-09-14

Result: three visible defects found during Argent exploratory testing.

Tested commit `cd859dac2c` on `diegolmello/upgrade-RN`, relative to `origin/develop`. iPhone 16 Pro simulator, iOS 26.0, 402 × 874 points. Rocket.Chat 4.77.0.1, React Native 0.81.5/Fabric; authenticated workspace `open.rocket.chat` (server 8.9.0).

Metro reported this worktree as projectRoot and the app loaded a fresh JavaScript bundle. Reused the installed native app; the local Debug build was timestamped 15:14, after the existing Podfile/project/patch edits. No native rebuild or native artifact identity check was performed, so this is UI/runtime coverage, not certification of the uncommitted native build changes.

## Findings

1. **Header text overlaps native buttons.** On Chats the workspace title/subtitle extend beneath Notifications/Create/Search/Directory. In general, the topic extends beneath the room actions. In the thread detail, its long title extends behind Follow thread. AX reports custom title frames beginning at x=0.179 with width=0.821 while action buttons occupy that same area. Expected: title/subtitle truncate within the remaining header space. See [Chats](rooms-header-overlap.png), [room](room-header-overlap.png), [thread](thread-header-overlap.png). Inspect custom header sizing in `app/views/RoomsListView/components/Header.tsx`, `app/containers/RoomHeader/RoomHeader.tsx`, and their new native header integration.

2. **Back buttons display internal route names.** Chats → Directory shows `RoomsListView`; general → Search/Threads/Actions shows `RoomView`. Before login, Workspace also showed `NewServerView`. Expected: a user-facing back title or a minimal back indicator. Confirmed after loading current branch JS for Directory and room destinations. See [Directory](directory-route-name.png) and [Search](room-search-route-name.png). Shared `nativeHeader` in `app/lib/methods/helpers/navigation/index.ts` does not configure a back-title policy, and custom-title screens retain internal route names.

3. **Skip label is invisible.** Chats → + → Channel → Select members shows an empty white pill at the top right. AX identifies an enabled `Skip` button at (0.623, 0.087, 0.328, 0.041). The empty pill persisted after settling; tapping it opened Create channel. Expected: visible Skip text. See [screenshot](invisible-skip.png). Relevant integration: `app/views/SelectedUsersView/index.tsx:88` and `headerItems.tsx`. Rendering root cause was not established.

## Coverage

| Path                                            | Observed result                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Login → More → Legal                            | Native More button navigates; Legal content renders                                                |
| Chats → Search → Close                          | Search mode opens, on-screen keyboard input filters the list, Close restores normal actions        |
| Chats → Directory → Filter                      | Directory loads channels; Filter opens channel/user/team choices; user selection initiated loading |
| Drawer → Profile → Preferences → Back           | Navigation and header layout pass                                                                  |
| Drawer → Settings → Security and privacy → Back | Navigation and header layout pass                                                                  |
| Drawer → Accessibility & appearance → Theme     | Header colors update for dark mode; restored Light, original Black dark level unchanged            |
| Chats → Create new → Channel → Skip             | Modal opens/closes; member selection and channel form navigation pass; Skip text fails visually    |
| Chats → general                                 | Room content loads; native back and thread badges render; header overlap fails visually            |
| general → Search                                | Correct input screen; internal back title fails                                                    |
| general → Threads → thread                      | Correct thread content and Follow thread control; long title overlaps                              |
| Follow thread → Unfollow thread                 | Label/icon and confirmation toast change both ways; original unfollowed state restored             |
| general → Actions → Room info                   | Navigation and layout pass                                                                         |
| Actions → Members → Filter                      | Members load; Online/All filter sheet opens and closes                                             |
| Actions → Discussions → Search → Close          | Discussions load; header switches to search and restores                                           |
| Return to Chats                                 | Authenticated session remains active                                                               |

## Runtime and limits

Argent log registry: 40 entries, 14 warnings, no error-level entries. Warnings include non-serializable navigation params, duplicate nested OutsideStack names, dependency deprecations, and development configuration/icon warnings. Their regression status was not established.

Argent keyboard(text) reported success but entered no text even after focusing the search input. A tap on the on-screen g key entered text and filtered results. This was treated as a tooling limitation. A few sequenced navigation waits failed due to transition timing or a wrong expected destination; current screens were inspected and navigation recovered. They were not counted as application failures.

This was one-off live exploratory testing, not a saved regression flow or exhaustive coverage of all 51 changed files. No before/after pixel diff was attempted because a stable baseline build was not captured. iOS versions below 26, iPad/master-detail, share extension, attachment downloads, omnichannel/admin permissions, encrypted-room states, calls, and message sending remain untested. No calls or messages were sent and no channel was created. Opening rooms may affect read receipts. No source fixes or test-suite runs were made.

The user completed login manually. No logout, cache clear, or reinstall was performed. Light theme and original thread-follow state were restored. Simulator left on Chats. Metro was started for this worktree and left running for further testing; Argent device/debugger connections were scoped for cleanup.
