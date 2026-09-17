/**
 * PoC toggle: when true, an incoming call still surfaces while the user is already in a call.
 * Read by `app/sagas/videoConf.ts`; `VoipIncomingCallDispatch.kt` keeps its own copy for the
 * Android native push path. Outgoing calls are unaffected.
 */
export const ALLOW_CONCURRENT_INCOMING_CALLS = true;

/**
 * PoC toggle: hand the microphone over to a video conference while keeping the VoIP call alive.
 * Read by `app/lib/services/voip/voipAudioHandoff.ts`.
 */
export const VIDEOCONF_AUDIO_HANDOFF = true;

/**
 * Handoff step 1 — stop the WebRTC capture track so the OS microphone is released.
 * `localParticipant.setMuted` only flips `track.enabled`, which keeps the device open.
 */
export const VIDEOCONF_HANDOFF_RELEASES_CAPTURE = true;

/**
 * Handoff step 2 — put the call on CallKit/Telecom hold and drop the audio session so the
 * videoconf (in-app WebView or out-of-app browser) can configure its own.
 */
export const VIDEOCONF_HANDOFF_HOLDS_NATIVE_CALL = true;
