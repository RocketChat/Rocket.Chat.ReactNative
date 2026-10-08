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

/**
 * PoC toggle: when true, a second incoming push rings instead of being auto-rejected as busy.
 * Mirrors `ALLOW_CONCURRENT_INCOMING_CALLS` in `app/lib/constants/callWaiting.ts`.
 * iOS already rings — its PushKit path never calls `VoipService.rejectBusyCall`.
 */
internal const val ALLOW_CONCURRENT_INCOMING_CALLS = true

internal fun decideIncomingVoipPushAction(
    isValidForIncomingHandling: Boolean,
    hasActiveCall: Boolean,
    allowConcurrentIncomingCalls: Boolean = ALLOW_CONCURRENT_INCOMING_CALLS
): VoipIncomingPushAction {
    if (!isValidForIncomingHandling) {
        return VoipIncomingPushAction.STALE
    }
    return if (hasActiveCall && !allowConcurrentIncomingCalls) {
        VoipIncomingPushAction.REJECT_BUSY
    } else {
        VoipIncomingPushAction.SHOW_INCOMING
    }
}
