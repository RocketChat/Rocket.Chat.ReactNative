**BASE_TIP:** 58e91f1b7

# Merge develop → feat.voip-lib-new (v6)

Executed from `.worktrees/merge-develop` on branch `merge/develop-into-voip-lib-new`.

## Slice 1 — Branch hygiene + worktree + preflight

- **Started:** 2026-04-08
- Archived prior aborted branch: `archive/merge-develop-v5-aborted-2026-04-08` → `ea118b952`
- Reset `merge/develop-into-voip-lib-new` to `58e91f1b7` (origin/feat.voip-lib-new)
- Created worktree at `.worktrees/merge-develop`
- `git fsck --no-dangling`: clean
- `df -h`: 23Gi free (user explicitly waived >100 GB precheck — "Don't worry about git or storage")
- Extracted `MERGE_NOTES.md.v5-baseline` from `archive/merge-develop-v5-aborted-2026-04-08:MERGE_NOTES.md`
- Primary checkout at `/Users/diegomello/Development/Work/Rocket.Chat.ReactNative` untouched

## Slice 2 — Initial baseline `yarn install`

- `yarn install` exit 0
- `node_modules/` populated
- `patch-package` applied all 15 patches cleanly (zero "Hunk failed"):
  `@discord/bottom-sheet@4.6.1`, `@rocket.chat/message-parser@0.31.31`, `@rocket.chat/sdk@1.3.3-mobile`,
  `@types/ejson@2.2.2`, `expo-file-system@18.1.7`, `expo-image@2.3.2`, `react-native@0.79.4`,
  `react-native-callkeep@4.3.16`, `react-native-easy-toast@2.3.0`, `react-native-mmkv@3.3.3`,
  `react-native-modal@13.0.1`, `react-native-notifier@1.6.1`, `react-native-picker-select@9.0.1`,
  `react-native-webview@13.15.0`, `remove-markdown@0.3.0`

## Slice 3 — Cherry-pick 2a: iOS 26 deployment target (#6974)

- `git cherry-pick -x 09ec94dac` → commit `79a987603` (clean, no conflicts)
  - Auto-merged `.github/actions/upload-ios/action.yml` and `ios/RocketChatRN/Info.plist`
  - 6 files changed, 10 insertions, 8 deletions
- Podfile: no VoIP pod entries to preserve (VoIP libs autolink via package.json; Podfile has no explicit `callkeep`/`media-signaling` refs, pre- or post-cherry-pick)
- Gates:
  - `yarn install` exit 0 (cached, 0.8s)
  - `yarn lint` exit 0 (184 warnings, 0 errors)
  - `yarn test` exit 0 (127 suites, 1022 tests, 317 snapshots, 18.2s)
  - `grep -rE "^<<<<<<< "` → 0
- Commit count `git log feat.voip-lib-new..HEAD --oneline | wc -l` == 1
- No `pod install` (deferred Phase 4)
- **Adapt:** created `.worktrees/.eslintrc.js` barrier (`module.exports = { root: true }`) to stop ESLint cascading from the worktree into the primary checkout's config (worktree is nested inside primary). Not tracked, not part of any commit.

## Slice 4 — Cherry-pick 2b: react-native-true-sheet (#6970)

- `git cherry-pick -x ec27a7c4c` → commit `4eba633eb`
- Conflicts resolved (`git checkout --theirs` on all 3):
  - `app/containers/ActionSheet/ActionSheet.tsx` → theirs (develop's TrueSheet usage)
  - `app/containers/TextInput/FormTextInput.tsx` → theirs (dropped `BottomSheetTextInput` import)
  - `jest.setup.js` → theirs (dropped bottom-sheet mock, gained TrueSheet mock)
- **Fallout from `--theirs` on `jest.setup.js`**: wiped VoIP-only mocks (`react-native-incall-manager`, `expo-haptics` object form). Restored via adapt commit below.
- `git grep '@discord/bottom-sheet'` in `app/views/CallView/**` → 0 hits
- Other VoIP-side `@discord/bottom-sheet` imports found in NewMediaCall stories + `bottomSheet` prop usages on `FormTextInput` in Dialpad.tsx + FilterHeader.tsx → migrated via adapt commit
- Gates:
  - `yarn install` exit 0 (patch-package: 15/15 applied, `@lodev09/react-native-true-sheet@3.7.3` replaces `@discord/bottom-sheet`)
  - `yarn lint` exit 0 (181 warnings, 0 errors)
  - `yarn test` exit 0 (128 suites, 1027 tests, 317 snapshots)
  - `grep -rE "^<<<<<<< "` → 0
- Snapshot regeneration (per-file, not blanket):
  - `FilterHeader.test.tsx.snap` (VoIP; justification: BottomSheet decorator removed → shallower render tree)
  - `Dialpad.test.tsx.snap` (VoIP; justification: `bottomSheet` prop removed from Dialpad.tsx + upstream RN TextInput `textAlign: "auto"` default)
  - `TextInput.test.tsx.snap`, `ServerItem.test.tsx.snap`, `Markdown.test.tsx.snap` (non-VoIP; justification: true-sheet render tree style churn from upstream components)
- **Adapt commit `021f3d664`**: `adapt: migrate VoIP screens off @discord/bottom-sheet (post true-sheet #6970)`
- Commit count: `git log feat.voip-lib-new..HEAD --oneline | wc -l` == 3 (2 cherry-picks + 1 adapt)

## Slice 5 — Cherry-pick 2c: reanimated v4 (#6720)

- `git cherry-pick -x 75d866b88` → commit `d8a2c8f06`
- Conflicts (4):
  - `package.json`: manual union — kept VoIP's `react-native-prompt-android: 1.1.0`, took develop's `react-native-reanimated: ^4.1.3` and `react-native-worklets: ^0.6.1`; other VoIP-exclusive deps (`react-native-platform-touchable`, `react-native-slowlog`, `react-native-webrtc`) were already on non-conflicted context lines and preserved automatically
  - `app/containers/AudioPlayer/Seek.tsx` → theirs (develop migrated from `useAnimatedGestureHandler` to `Gesture.Pan()` API; VoIP did not touch this file)
  - `app/containers/message/__snapshots__/Message.test.tsx.snap` → theirs, then regenerated post-install (see adapt below)
  - `yarn.lock`: **attempted regeneration from scratch failed** — patch-package bombed on `@rocket.chat/message-parser` (0.31.31 → 0.31.35) and `react-native-webview` (13.15.0 → 13.16.1) because yarn floated to newer compatible versions with an empty lock. Recovered by `git checkout 75d866b88 -- yarn.lock` (develop's reanimated-PR lock), then `yarn install` to reconcile VoIP-only entries. All 15 patches applied cleanly afterwards. **Recipe for future cherry-picks: prefer `git checkout <sha> -- yarn.lock` over `rm yarn.lock && yarn install`.**
- `babel.config.js` → byte-identical to `git show origin/develop:babel.config.js` (not conflicted; auto-merged)
- Gates:
  - `yarn install` exit 0 (all 15 patches applied)
  - `yarn lint` exit 0 (176 warnings, 0 errors)
  - `yarn test` exit 0 (128 suites, 1027 tests, 317 snapshots)
  - `grep -rE "^<<<<<<< "` → 0
- Snapshot regeneration (per-file, not blanket):
  - `Message.test.tsx.snap` (non-VoIP; 98 updated, 5 obsolete removed; justification: reanimated 4 worklets runtime + Seek.tsx gesture API migration alter the render tree of message components that embed the audio player)
- **Adapt commit `95fbb9669`**: `adapt: regenerate Message.test.tsx.snap for reanimated 4 (#6720)`
- Commit count: `git log feat.voip-lib-new..HEAD --oneline | wc -l` == 5 (3 cherry-picks + 2 adapts)

## Slice 6 — Cherry-pick 2d: RN 81 + Expo 54 (#6875)

- `git cherry-pick -x 91b223410` → commit `d8b48adba`
- Highest-risk single slice. Recipes applied per v6 plan.
- Conflicts:
  - **modify/delete (VoIP deleted, develop modified)** — resolved with `git rm`:
    - `app/containers/InAppNotification/__snapshots__/NotifierComponent.test.tsx.snap`
    - `app/containers/message/Touch.tsx`
  - **content (`--theirs`, develop's version)**: 16 snapshot files + `ios/Podfile.lock` + `ios/RocketChatRN.xcodeproj/project.pbxproj`
  - **content (`--ours`, VoIP's version)**:
    - `app/containers/Button/index.tsx` (VoIP migrated from `RectButton` → `Touchable`)
    - `app/containers/UIKit/Overflow.tsx` (VoIP uses `Touchable` + `touchable[blockId]` ref pattern; develop's version imports a `Touch` helper that VoIP removed)
  - **`package.json`**: took theirs then spliced 12 VoIP-exclusive deps back alphabetically:
    - dependencies: `@rocket.chat/media-signaling`, `react-native-callkeep`, `react-native-incall-manager`, `react-native-platform-touchable`, `react-native-prompt-android`, `react-native-slowlog`, `react-native-webrtc`, `zustand`
    - devDependencies: `@types/react-native-platform-touchable`, `eslint-plugin-jsx-a11y`, `lint-staged`
    - Dropped VoIP-side `prop-types` (unused in app/)
  - **`yarn.lock`**: `git checkout 91b223410 -- yarn.lock` then `yarn install` to reconcile VoIP entries (recipe from slice 5)
- patch-package post-install: 14/14 applied (down from 15 — `expo-image+2.3.2.patch` correctly died on expo-image 3.0.x bump)
- Native config: `ios/Podfile.lock`, `ios/RocketChatRN.xcodeproj/project.pbxproj`, `android/` files — all took develop's RN 81 / AGP / Kotlin / Gradle bumps (auto-merged or `--theirs`)
- Package.json AC checks:
  - `react-native` == `0.81.5` ✓
  - `expo` == `^54.0.0` ✓
  - `@rocket.chat/media-signaling` == `file:./packages/rocket.chat-media-signaling-0.1.3.tgz` ✓
  - `react-native-callkeep` == `4.3.16` ✓
- Patches AC checks:
  - `patches/react-native-callkeep+4.3.16.patch` ✓ exists
  - `patches/expo-image+2.3.2.patch` ✓ absent
  - `patches/react-native+0.79.4.patch` ✓ absent
  - `patches/react-native+0.81.5.patch` ✓ exists
- Gates:
  - `yarn install` exit 0
  - `npx patch-package` (via postinstall): 14/14 applied, zero "Hunk failed"
  - `yarn lint` exit 0 (176 warnings, 0 errors after adapt fixes)
  - `yarn test` exit 0 (128 suites, 1027 tests, 317 snapshots after regen)
  - `grep -rE "^<<<<<<< "` → 0
- **Adapt commit `4dbc1185b`**: `adapt: RN 81 + Expo 54 render-tree churn and type tightening (#6875)` — 200 snapshots updated + 8 obsolete removed across 26 suites; 2 TS tightening fixes (`ForwardMessageView` dead `?? true`, `RoomView` @ts-ignore for screen name generic); `jest.setup.js` eslint --fix; `yarn.lock` reconciled for VoIP-only deps.
- Commit count: `git log feat.voip-lib-new..HEAD --oneline | wc -l` == 7 (4 cherry-picks + 3 adapts)

## SHA mapping table (cherry-picks 2a–2d)

| # | Source (origin/develop) | Applied (merge branch) | PR | Purpose |
|---|---|---|---|---|
| 2a | `09ec94dac` | `79a987603` | #6974 | iOS 26 deployment target |
| 2b | `ec27a7c4c` | `4eba633eb` | #6970 | Migrate to react-native-true-sheet |
| 2c | `75d866b88` | `d8a2c8f06` | #6720 | Upgrade reanimated to v4 |
| 2d | `91b223410` | `d8b48adba` | #6875 | Upgrade to RN 81 + Expo 54 |

## Slice 7 — Bulk merge + per-file recipes + Kotlin compile gate

- **Started:** 2026-04-08
- `git merge origin/develop --no-ff --no-commit` → 23 conflicts
- Merge base: `58e91f1b7` (feat.voip-lib-new tip = `4dbc1185b` after slice 6)
- **NOT YET COMMITTED** — Slice 8 (`NotificationIntentHandler.kt` sanity pause) must run first.

### Per-file resolutions

| File | Strategy | Notes |
|---|---|---|
| `package.json` | manual union — take theirs, splice VoIP-only deps | Re-added `react-native-platform-touchable`, `react-native-slowlog`, `@types/react-native-platform-touchable`, `react-native-incall-manager`, `react-native-prompt-android`, `react-native-webrtc`, `@rocket.chat/media-signaling` (already present), `zustand` (already present). devDeps: `eslint-plugin-jsx-a11y`, `lint-staged`. |
| `yarn.lock` | `git checkout MERGE_HEAD -- yarn.lock` + `yarn install` reconcile | Recipe from slice 5/6. Develop lock became base; yarn install added VoIP-only entries. 14/14 patches applied clean. Develop bumped patch targets: `@rocket.chat/message-parser+0.31.32`, `expo-file-system+19.0.21`, `react-native-webview+13.16.1`. |
| `jest.setup.js` | manual — take theirs style on 3 formatting conflicts, preserve VoIP mocks | Conflicts were pure prettier body-style (arrow concise vs braced + parens). VoIP mocks `react-native-incall-manager` + `expo-haptics` (object form with `ImpactFeedbackStyle`) preserved from slice 4 adapt. |
| `android/app/src/main/java/chat/rocket/reactnative/MainApplication.kt` | union — keep both imports + both `add()` calls | VoIP's `VoipTurboPackage` + develop's `InvertedScrollPackage`. Class body auto-merged cleanly (only the import block needed manual resolution). |
| `android/app/build.gradle` | union — keep both deps | `testImplementation 'junit:junit:4.13.2'` (VoIP) + `implementation 'androidx.lifecycle:lifecycle-process:2.8.7'` (develop). |
| `app/sagas/login.js` | manual — base ours (VoIP), layer develop's new logic | Kept VoIP's `disconnect` import (develop's unused `connect` import dropped). Added develop's `setUserPresenceAway` restApi import, `checkBackgroundAndSetAway` function, and `yield fork(checkBackgroundAndSetAway)` call. VoIP's `startVoipFork`, `getUserPresence(user.id)`, and removal of `fetchEnterpriseModulesFork` preserved. |
| `app/containers/message/Touch.tsx` | re-deleted (`git rm -f`) | VoIP intentionally removed this file; merge re-added it from develop. Re-deleted since VoIP code no longer references it (0 importers). |
| `app/containers/InAppNotification/NotifierComponent.{test.tsx,stories.tsx}` + snapshot | re-deleted (`git rm -f`) | VoIP removed the component; merge re-added test/stories from develop. Test file has no component to target. |
| `app/containers/CustomIcon/selection.json`, `ios/custom.ttf`, `android/app/src/main/assets/fonts/custom.ttf` | `--theirs` | VoIP didn't touch icon font assets (empty log); take develop's bump. |
| 15 non-VoIP snapshots (Avatar, DirectoryItem, List, LoginServices, RoomItem, ServerItem, TextInput, UIKitMessage, UIKitModal, Message, DiscussionsView/Item, ServersHistoryItem, LoadMore, ThreadMessagesView/Item) | `--theirs` then regenerate per-file | All 15 failures were pure theme color diffs (`#E4E7EA` → `#C1C7D0`). No logic changes. |
| 9 regenerated snaps after install (Avatar, List, InAppNotification/NotifierComponent, CallView/index, DiscussionsView/Item, ThreadMessagesView/Item, RoomItem, UIKit/UiKitMessage, LoadMore) | `yarn jest -u <explicit paths>` | 15 snapshots updated across 9 suites. CallView/index is VoIP-touched — its snapshot matches VoIP's current component output. No blanket `-u`. |

### Post-merge eslint --fix

`yarn eslint . --fix` cleared 7 autofixable prettier errors (`(error)` → `error` arrow-paren rule) across index.js + sagas/login.js + sagas/deepLinking.js. 0 errors, 172 warnings remain (same warning surface as post-slice-6).

### Gates

- `grep -rE "^<<<<<<< " -- android/app/src/main app android ios` → 0 ✓
- `yarn install` exit 0; 14/14 patches applied clean
- `yarn lint` exit 0 (0 errors, 172 warnings)
- `yarn test` exit 0 (129 suites, 1056 tests, 331 snapshots)
- **`cd android && ./gradlew compileDebugKotlin` BUILD SUCCESSFUL** in 1m 29s (340 tasks; only warnings were from `react-native-screens` upstream, none from VoIP code) ✓
- `grep VoipTurboPackage android/app/src/main/java/chat/rocket/reactnative/MainApplication.kt` → 2 ✓
- `grep media-signaling android/app/build.gradle` → 0 (VoIP's baseline build.gradle also had 0; media-signaling is autolinked from package.json `file:./packages/rocket.chat-media-signaling-0.1.3.tgz`, not declared in build.gradle). **Plan AC line is informational only for this repo.**
- `packages/rocket.chat-media-signaling-0.1.3.tgz` present ✓ (not a conflict)
- `NotificationIntentHandler.kt` auto-merged cleanly (no conflict markers); `grep VoipNotification` == 2. Slice 8 code-reviewer sanity pause still required.

## Slice 8 — NotificationIntentHandler.kt sanity pause

- **Started:** 2026-04-08
- The file auto-merged cleanly during Slice 7's `git merge origin/develop --no-ff` (no conflict markers).
- Sanity-pause review performed via the `oh-my-claudecode:code-reviewer` subagent on the resolved file, with explicit instruction to verify the three VoIP invariants (VoipPayload parsing, MediaCallEvents emissions, no VoIP branch dropped).

### Resolved diff vs HEAD (VoIP baseline)

```diff
@@ -98,6 +98,20 @@ class NotificationIntentHandler {
             }
 
             try {
+                val notId = extras.getString("notId")
+                
+                // Clear the notification messages from the static map to prevent stacking
+                if (!notId.isNullOrEmpty()) {
+                    try {
+                        val notIdInt = notId.toIntOrNull()
+                        if (notIdInt != null) {
+                            CustomPushNotification.clearMessages(notIdInt)
+                        }
+                    } catch (e: Exception) {
+                        Log.e(TAG, "Error clearing notification messages for ID $notId: ${e.message}", e)
+                    }
+                }
+
                 // Extract all notification data from Intent extras
                 // Only include serializable types to avoid JSON serialization errors
                 val notificationData = mutableMapOf<String, Any?>()
```

### NotificationIntentHandler.kt review

**Verdict: PASS**

**Invariant 1 — VoIP early-return intact (line 25-27)**
```kotlin
if (VoipNotification.handleMainActivityVoipIntent(context, intent)) {
    return
}
```
First statement in `handleIntent()`. If the intent is a VoIP payload, it is parsed into `VoipPayload`, handled, and control returns immediately. VoipPayload parsing path preserved.

**Invariant 2 — `clearMessages` block positioned on non-VoIP path only**
The new block (lines 101-113) lives inside `handleNotificationIntent()` (private method, line 91), which is only reached via line 35 — AFTER both the VoIP early-return (line 25) and the videoconf early-return (line 30). A VoIP intent cannot reach `CustomPushNotification.clearMessages()`. The block additionally sits inside the `ejson`-guard (line 96), so it only runs for real push notifications with payload data.

**Invariant 3 — `caller` key rename preserved (line 53, 69-72)**
VoIP branch's `callerName` → `caller` rename survived the merge in the videoconf handler. No regression to the old key.

**MediaCallEvents code paths** — `MediaCallEvents` is not referenced in this file directly; emissions happen inside `VoipNotification.handleMainActivityVoipIntent()`, called unchanged at line 25. No VoIP branch was dropped.

**No VoIP branch dropped** — three-branch dispatch structure (VoIP → VideoConf → Regular Notification) fully intact at lines 25-35.

**Merge semantics summary** — The `origin/develop` addition (`notId`/`clearMessages` cleanup) was semantically independent from VoIP's additions (early-return + `caller` key rename). Auto-merge placed the develop-side change inside `handleNotificationIntent()` — the correct non-VoIP, non-videoconf code path — and left both VoIP modifications untouched. All three invariants hold. Slice 8 merge is safe to keep.

### Invariants verified manually after subagent review

- [x] VoIP push payloads still parsed into `VoipPayload` (via `VoipNotification.handleMainActivityVoipIntent` at line 25)
- [x] `MediaCallEvents` emissions still fire on same paths (indirectly via `VoipNotification`, unchanged call site)
- [x] No VoIP-specific branch dropped (three-branch dispatch intact)

