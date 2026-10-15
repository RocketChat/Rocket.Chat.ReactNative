# Native Video Conference

An **Embedded Video Conference** (provider LiveKit, `capabilities.embedded`) is joined inside the app with `@livekit/react-native`. Jitsi Video Conferences keep their WebView flow.

## Join sequence

`video-conference.start` (new calls only) → `video-conference.join` (answers `url: ''`) → `GET video-conference.callConfig` → connect → `video-conference.heartbeat` every 30 s → `video-conference.leave` once.

`ConferenceSession` (`app/lib/services/conference/ConferenceSession.ts`) owns the sequence, the LiveKit `Room`, heartbeat and leave. UI reads Zustand stores (`useConferenceCallStore`, `useConferenceRoomStore`, `useConferenceInteractionStore`), never the session directly.

## Provider choice

`videoConf.ts` reads `info.providerName` of the call being joined and falls back to `capabilities.providerName` for a call that does not exist yet. Embedded calls open `ConferenceView`; everything else goes through the Jitsi path.

## Data channel

JSON messages on the room's data channel, no topic: `{ type: 'hand' }` (reliable; the raiser rebroadcasts on every `ParticipantConnected`), `{ type: 'reaction' }` (unreliable; rendered locally), `{ type: 'mute' }` (reliable; only the target acts). The codec lives in `callDataProtocol.ts` and matches the web client.

## Screens

`ConferenceView` switches on the call phase: preflight, joining, connecting, in call, ended, error. Every surface reads `useTheme()`; the screen follows the light, dark and black themes.

- Menus, People, Add people and Connection info open in the shared `ActionSheet` (TrueSheet).
- Layouts: grid, spotlight, sidebar. A screen share takes the stage; the other tiles become thumbnails.
- The chat button navigates to the Room and leaves the call running (Return-to-call row), and shows the Room's unread count.
- People marks members who cannot see the Room's chat (`chatAccess.membersWithoutAccess`); the notice above the list opens the Room.
- A call that drops offers Join call again, which goes back to the preflight; cancelling the preflight after being rung sends `video-conference.decline`.

## Provider

`videoConfJoin` asks `video-conference.info` which provider the call runs on. If that lookup fails it shows the usual error; it does not guess from the Workspace default.

## Audio

`registerLiveKitGlobals` passes `autoConfigureAudioSession: false`. The session starts and stops LiveKit's `AudioSession` with the call, so 1:1 VoIP keeps CallKit/Telecom ownership of audio outside a conference. `isInActiveVoipCall()` and the active conference phase block each other.

## Screen sharing

- **Android**: `ConferenceCallService` is a foreground service that is always `mediaPlayback` (so a listen-only user keeps call audio in the background) and adds `microphone` and `camera` when those permissions are granted. `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and `FOREGROUND_SERVICE_MEDIA_PROJECTION` and the LiveKit media projection service are enabled in the manifest.
- **iOS**: `ScreenCapturePickerView` presents the system broadcast picker; the `BroadcastUpload` extension streams frames to the app over a Unix socket in the App Group container (`rtc_SSFD`). `RTCAppGroupIdentifier` and `RTCScreenSharingExtension` in `ios/RocketChatRN/Info.plist` point the SDK at the App Group and the extension bundle id.

`BroadcastUpload` needs the bundle id `chat.rocket.ios.BroadcastUpload` and the `group.ios.chat.rocket` App Group registered for the Apple team, plus a `match AppStore` provisioning profile. `ios/BroadcastUpload` sources are adapted from the LiveKit React Native example (Apache License 2.0).

## Ringing

The server emits a `ring` event on `stream-notify-user` (`<userId>/video-conference`) for Embedded Video Conferences. `onEmbeddedRing` in `app/sagas/videoConf.ts` shows `EmbeddedCallNotification` while the app is in the foreground; Accept joins through `videoConfJoin`, Decline calls `video-conference.decline`.
