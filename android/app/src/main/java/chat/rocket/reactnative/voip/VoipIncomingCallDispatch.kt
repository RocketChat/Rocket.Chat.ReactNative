package chat.rocket.reactnative.voip

/**
 * Pure routing for an incoming VoIP FCM push after [VoipPayload.isVoipIncomingCall] is true.
 * Stale (invalid or expired lifetime) pushes must not reach busy vs show branching.
 */
internal enum class VoipIncomingPushAction {
    STALE,
    REJECT_BUSY,
    SHOW_INCOMING
}

internal fun decideIncomingVoipPushAction(
    isValidForIncomingHandling: Boolean,
    hasActiveCall: Boolean
): VoipIncomingPushAction {
    if (!isValidForIncomingHandling) {
        return VoipIncomingPushAction.STALE
    }
    return if (hasActiveCall) {
        VoipIncomingPushAction.REJECT_BUSY
    } else {
        VoipIncomingPushAction.SHOW_INCOMING
    }
}
