/**
 * PoC toggle: when true, an incoming call still surfaces while the user is already in a call.
 * Read by `app/sagas/videoConf.ts`; `VoipIncomingCallDispatch.kt` keeps its own copy for the
 * Android native push path. Outgoing calls are unaffected.
 */
export const ALLOW_CONCURRENT_INCOMING_CALLS = true;
