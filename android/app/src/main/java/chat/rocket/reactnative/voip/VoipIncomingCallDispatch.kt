package chat.rocket.reactnative.voip

/**
 * Pure routing for an incoming VoIP FCM push after [VoipPayload.isVoipIncomingCall] is true.
 * Stale (invalid or expired lifetime) pushes must not reach busy vs show branching.
 */
internal enum class VoipIncomingPushAction {
    STALE,
    IGNORE_NO_PERMISSION,
    REJECT_BUSY,
    SHOW_INCOMING
}

/**
 * Pure routing decision for an incoming VoIP push.
 * Precedence: stale → mic denied → busy → show. Mic-denied precedes busy and suppresses the call
 * locally with no server signal, so it keeps ringing on the user's other devices.
 */
internal fun decideIncomingVoipPushAction(
    isValidForIncomingHandling: Boolean,
    hasActiveCall: Boolean,
    hasMicPermission: Boolean
): VoipIncomingPushAction {
    if (!isValidForIncomingHandling) {
        return VoipIncomingPushAction.STALE
    }
    if (!hasMicPermission) {
        return VoipIncomingPushAction.IGNORE_NO_PERMISSION
    }
    return if (hasActiveCall) {
        VoipIncomingPushAction.REJECT_BUSY
    } else {
        VoipIncomingPushAction.SHOW_INCOMING
    }
}
