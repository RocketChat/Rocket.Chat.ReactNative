# Native Video Conference

An **Embedded Video Conference** (provider LiveKit, `capabilities.embedded`) is joined inside the app with `@livekit/react-native`. Jitsi Video Conferences keep their WebView flow.

## Join sequence

`video-conference.start` (new calls only) → `video-conference.join` (answers `url: ''`) → `GET video-conference.callConfig` → connect → `video-conference.heartbeat` every 30 s → `video-conference.leave` once.

`ConferenceSession` (`app/lib/services/conference/ConferenceSession.ts`) owns the sequence, the LiveKit `Room`, heartbeat and leave. UI reads Zustand stores (`useConferenceCallStore`, `useConferenceRoomStore`, `useConferenceInteractionStore`), never the session directly.

## Provider choice

Joining an existing call reads `info.providerName` of that call (`videoConfJoin`). If that lookup fails it shows the usual error; it never guesses from the Workspace default. Only starting a new call, which has no `info` yet, uses `capabilities.providerName`. Embedded calls open `ConferenceView`; everything else goes through the Jitsi path.

## Data channel

JSON messages on the room's data channel, no topic: `{ type: 'hand' }` (reliable; the raiser rebroadcasts on every `ParticipantConnected`), `{ type: 'reaction' }` (unreliable; rendered locally), `{ type: 'mute' }` (reliable; only the target acts). The codec lives in `callDataProtocol.ts` and matches the web client.

## Screens

`ConferenceView` switches on the call phase: preflight (which also covers joining and connecting), in call, ended, error. Every surface reads `useTheme()`; the screen follows the light, dark and black themes.

- While the call is joining or connecting the preflight stays on screen: the Start call or Join call button shows a spinner and cannot be pressed again, the call name and the microphone and camera buttons lock, and the camera preview is released so LiveKit can open the camera. Cancel stays available and, unlike before the user pressed Join, does not send `video-conference.decline`.
- A new call keeps its "start" wording while it connects, even though `join` swaps the placeholder call id for the real one (`startedNewCall`).

- Menus, People, Add people and Connection info open in the shared `ActionSheet` (TrueSheet).
- A raised hand is announced by a pill on the header's own line, beside the speaker and chat buttons (our own hand included, as "You"). It adds no row, so the stage keeps its size and the tiles do not resize when a hand goes up. Who is presenting gets a row of its own under the header, only while someone shares.
- The controls row is mic, camera, hand, reaction, More and Leave. More holds People (with how many are in the call beside it), share screen, layout, switch camera, resolution, picture in picture and connection info.
- Layouts: grid, spotlight, sidebar. A screen share takes the stage; the other tiles become thumbnails.
- The chat button leaves the call running (Return-to-call row) and shows the Room's unread count. It opens the Room, or, when the Workspace keeps call chats in a thread (`VideoConf_Enable_Persistent_Chat` and `VideoConf_Conference_Window_Enabled` on, `VideoConf_Persistent_Chat_Mode` set to `thread`, and the call has no discussion), the thread of the call's own message (`info.messages.started`) over the Room, the same rule as the web (`getConferenceChatThreadId`).
- People marks members who cannot see the Room's chat (`chatAccess.membersWithoutAccess`); the notice above the list opens the chat access sheet (see Chat access).
- A call that drops offers Join call again, which goes back to the preflight; cancelling the preflight after being rung sends `video-conference.decline`.

## Audio

`registerLiveKitGlobals` passes `autoConfigureAudioSession: false`. The session starts and stops LiveKit's `AudioSession` with the call, so 1:1 VoIP keeps CallKit/Telecom ownership of audio outside a conference. A VoIP call and a conference never run together: `openConferenceCall` shows the already-in-call alert while `isInActiveVoipCall()`, `MediaSessionInstance` shows it (and refuses, or ends an incoming call) while `isInConferenceCall()`, and the ring popups of `app/sagas/videoConf.ts` are dropped while a VoIP call is active.

The speaker button in the header opens the list of outputs the platform reports (speaker, earpiece, headset, Bluetooth; on iOS also the system route picker). Choosing one calls `selectAudioOutput` and stores it as `audioOutput`, which the button's icon follows. LiveKit can only be asked to switch output, not which one is active, so an output the system picks by itself (a headset plugged in mid-call) is not reflected until the user chooses one.

## Raised hand

A tile shows a raised hand as a chip that starts as the hand alone and widens to the right a moment later to reveal the place in the queue and the name (`RaisedHandChip`; shown at once when the system asks for reduced motion). Our own chip is green and everybody else's is white with dark text (`getRaisedHandColors`). The header pill is not animated.

A short two-note chime (`playHandRaisedSound`, the same notes as the web) plays when somebody else's hand goes up and when ours does. A hand that was already up, one repeated for someone who just arrived (`rebroadcast`), and a hand going down are silent (`isHandNews`). The player is created with `keepAudioSessionActive` so finishing the chime never deactivates the audio session the call is using, and it is released when the call ends. Neither platform has been checked on a device yet.

A raised hand drops by itself once its owner has been speaking for about three seconds (`useAutoLowerHand`, `advanceAutoLowerHand`): they have the floor. A pause longer than 0.8 s starts the count again. The web does the same, but it reads the local microphone level against a fixed threshold, while the app takes "speaking" from LiveKit's active-speaker signal, so background noise can also count.

## Speaking border

The border on a tile appears from the audio level heard on the device (`TileSpeakingMonitor`, using the SDK's volume processor on each tile's microphone track), not from LiveKit's active-speaker signal, which the server only refreshes about every 500 ms. The server's signal is still used as well, so the border shows even where a level cannot be read, and calls with more than nine tiles rely on it alone to avoid a listener per tile.

## Screen sharing

- **Android**: `ConferenceCallService` is a foreground service that is always `mediaPlayback` (so a listen-only user keeps call audio in the background) and adds `microphone` and `camera` when those permissions are granted. `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and `FOREGROUND_SERVICE_MEDIA_PROJECTION` and the LiveKit media projection service are enabled in the manifest.
- **iOS**: `ScreenCapturePickerView` presents the system broadcast picker; the `BroadcastUpload` extension streams frames to the app over a Unix socket in the App Group container (`rtc_SSFD`). `RTCAppGroupIdentifier` and `RTCScreenSharingExtension` in `ios/RocketChatRN/Info.plist` point the SDK at the App Group and the extension bundle id.

`BroadcastUpload` needs the bundle id `chat.rocket.ios.BroadcastUpload` and the `group.ios.chat.rocket` App Group registered for the Apple team, plus a `match AppStore` provisioning profile. `ios/BroadcastUpload` sources are adapted from the LiveKit React Native example (Apache License 2.0).

## Picture in picture

While the call screen is open (`expanded`), leaving the app shrinks the call into a system window. `pickPipSource` chooses what it shows: a screen shared by someone else first (never our own share), then the active speaker, then the first remote camera, then the first remote avatar, then ourselves. The More menu also has a "Picture in picture" entry that enters it by hand.

- **Android**: `ConferencePictureInPicture` allows it only while the call screen is open. From Android 12 the system enters it on its own (`setAutoEnterEnabled`); on Android 8-11 `MainActivity.onUserLeaveHint` does. The safe-area insets stay at their full-screen values inside the small window, so the app-wide `MediaCallHeader` (a status bar backdrop on Android) hides itself while `pictureInPicture` is set in `useConferenceCallStore`, and `ConferencePipView` is positioned absolutely so the screen's bottom padding does not apply. Android reports every change through `ConferencePictureInPictureChanged`, and `useConferencePictureInPicture` swaps the call screen for `ConferencePipView` while it is showing.
- **iOS**: `ConferencePipSource` renders a 16x9 `VideoTrack` with `iosPIP` behind the stage, so the LiveKit WebRTC fork starts the system window itself when the app goes to the background. A source with no video (an avatar) has nothing to feed the window with, so only Android shows it.

Camera capture pauses in the iOS background unless the app has Apple's multitasking camera access entitlement, so the window shows what others send, not our own camera.

## Chat access

Being in a call does not give access to its chat room, so some people can be in the call without being able to read the chat. `info.chatAccess.membersWithoutAccess` lists them. While someone in the call is in that list, and the viewer can read the chat, `ChatAccessNotice` shows how many (dismissable). Review, or the same notice in the People sheet, opens `ChatAccessSheetContent`, which offers the two remedies the server has: `video-conference.share-chat` with `mode: 'invite'` adds them to the room (only where `canInvite`), `mode: 'discussion'` moves the chat to a new discussion. `getChatAccessActions` decides which one leads, the same rule the web uses (a private room or a DM leads with the discussion). The chat button is separate: it only opens the Room or its thread.

## Camera

Long-pressing the camera button opens the camera options. When the device reports three or more cameras (for example a back ultra-wide) it also offers Choose camera. A camera picked by id is asked for with `deviceId: { exact }`, and Switch camera clears it again and asks only for the other facing. Mobile has no microphone picker: the WebRTC library lists a single microphone, and the input follows the audio route, which the speaker menu on the microphone button already switches (earpiece, speaker, headset, Bluetooth).

## Speaking while muted

LiveKit stops capturing audio while the microphone is muted, so the SDK's volume processor has nothing to measure. On Android `ConferenceMicLevelMonitor` records from the microphone with its own `AudioRecord` and reports an RMS level every 100 ms, only while the call screen is open in the foreground and the microphone is muted. `useSpeakingWhileMuted` turns those levels into "the user is speaking" with the thresholds the web uses (sustained 400 ms, released after 3 s), and `SpeakingWhileMutedNotice` says so. It is information only; unmuting stays on the microphone button. `conferenceSession.setMicrophone` awaits the monitor letting go of the microphone before it unmutes, so the two recorders never overlap. There is no iOS counterpart yet.

## Call notification

On Android tapping the call's notification re-opens the call screen. `ConferenceCallService` marks its notification with `EXTRA_OPEN_CALL`, `NotificationIntentHandler` hands the intent to `ConferenceCallOpenRequest`, and `useConferenceCallOpenRequest` (mounted in `ConferenceCallGuard`) expands the call when the request is consumed, either from the `ConferenceCallOpenRequested` event or when the app returns to the foreground.

## Ringing

The server emits a `ring` event on `stream-notify-user` (`<userId>/video-conference`) for Embedded Video Conferences. `onEmbeddedRing` in `app/sagas/videoConf.ts` shows `EmbeddedCallNotification` while the app is in the foreground; Accept joins through `videoConfJoin`, Decline calls `video-conference.decline`.

## Before a release

Things the code cannot settle and that need a person, a store console or a device:

- **Play Console**: the app now declares foreground service permissions for camera, microphone, media playback and media projection (`FOREGROUND_SERVICE_CAMERA`, `_MICROPHONE`, `_MEDIA_PLAYBACK`, `_MEDIA_PROJECTION`) next to the existing phone call one. Each type needs its declaration and a short video in the Foreground service permissions form.
- **Android 15 and media projection**: the manifest used to strip the WebRTC `MediaProjectionService` because Android 15 forbids starting a `mediaProjection` foreground service from a `BOOT_COMPLETED` receiver, and Play Console flags that as a crash risk. The service is enabled again so screen sharing can publish. Check the pre-launch report for that warning and that no boot receiver starts it.
- **1:1 VoIP regression**: the WebRTC build moved from `react-native-webrtc` (M124) to `@livekit/react-native-webrtc` (M144), which also backs `@rocket.chat/media-signaling`. Run a full VoIP pass on both platforms (CallKit, Telecom, speaker routing, foreground service, ringback) before shipping.
- **`react-native-url-polyfill` 3**: the five URL helpers that use it have unit tests; spot-check server URL entry, deep links and attachment links on a device.
- **Cold start**: `LiveKitReactNative.setup` runs before `Bugsnag.start`. Measure cold start on a low-end Android device and confirm a native crash during `setup` still reaches Bugsnag.
- **Picture in picture**: `MainActivity` declares `supportsPictureInPicture`. On Android 8-11, where `onUserLeaveHint` enters the window, a permission dialog opened during a call can also shrink it; confirm on a real device. iOS picture in picture has not been run on a device yet.
- **Apple**: register `chat.rocket.ios.BroadcastUpload` and the `group.ios.chat.rocket` App Group, and create the `match AppStore` profile for the extension, before the first iOS build with screen sharing.
- **Release notes**: an older app build joined to a LiveKit call joins on the server and then fails, and stays shown as busy for up to about 3 minutes.
