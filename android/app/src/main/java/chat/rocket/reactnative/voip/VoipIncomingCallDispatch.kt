package chat.rocket.reactnative.voip

/**
 * Pure routing for an incoming VoIP FCM push after [VoipPayload.isVoipIncomingCall] is true.
 * Stale (invalid or expired lifetime) pushes must not reach busy vs show branching.
 */
internal enum class VoipIncomingPushAction {
    STALE,
    REJECT_NO_PERMISSION,
    REJECT_BUSY,
    SHOW_INCOMING
}

/**
 * Precedence (encodes the agreed push-layer microphone gate; see adr/0002):
 * not valid (stale/expired) → STALE; microphone denied → REJECT_NO_PERMISSION;
 * already on a call → REJECT_BUSY; otherwise → SHOW_INCOMING.
 *
 * The microphone-denied branch deliberately precedes busy. In practice an active call implies the
 * permission is granted, so the combination is near-impossible; the explicit ordering removes ambiguity.
 * [hasMicPermission] defaults to granted so existing callers keep their current outcomes.
 */
internal fun decideIncomingVoipPushAction(
    isValidForIncomingHandling: Boolean,
    hasActiveCall: Boolean,
    hasMicPermission: Boolean = true
): VoipIncomingPushAction {
    if (!isValidForIncomingHandling) {
        return VoipIncomingPushAction.STALE
    }
    if (!hasMicPermission) {
        return VoipIncomingPushAction.REJECT_NO_PERMISSION
    }
    return if (hasActiveCall) {
        VoipIncomingPushAction.REJECT_BUSY
    } else {
        VoipIncomingPushAction.SHOW_INCOMING
    }
}
