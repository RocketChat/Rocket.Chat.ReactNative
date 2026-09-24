/**
 * When true, an incoming video conference still surfaces while the user is already in a VoIP call.
 * Read by `app/sagas/videoConf.ts`; `VoipIncomingCallDispatch.kt` and `VoipService.swift` keep
 * their own copies for the native VoIP push path. Outgoing calls are unaffected.
 *
 * The two calls never share the microphone — accepting the conference ends the VoIP call, after
 * the confirmation in `confirmEndVoipCallForVideoConf`.
 */
export const ALLOW_CONCURRENT_INCOMING_CALLS = true;
