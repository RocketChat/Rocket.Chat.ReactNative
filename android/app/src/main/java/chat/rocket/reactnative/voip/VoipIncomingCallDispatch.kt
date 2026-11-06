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

/**
 * Decides whether an incoming DDP media-signal message should trigger native call dismissal
 * (e.g. CallKit/Notification dismissal before JS answers).
 *
 * A call should be dismissed if:
 * 1. The caller hung up (signalNotification == "hangup")
 * 2. Another device answered the call (signalNotification == "accepted" AND signedContractId is non-empty AND signedContractId != currentDeviceId)
 *
 * Mismatched signedContractId on initial setup or negotiation (external SIP/FreeSWITCH trunk contract)
 * without `signalNotification == "accepted"` must NOT dismiss the incoming call (fixes Rocket.Chat issue #7702).
 */
internal fun shouldDismissIncomingCallOnSignal(
    signalType: String?,
    signalNotification: String?,
    signedContractId: String?,
    deviceId: String?
): Boolean {
    if (signalType != "notification") {
        return false
    }
    val isHangup = signalNotification == "hangup"
    val isAcceptedOnAnotherDevice = signalNotification == "accepted" &&
        !signedContractId.isNullOrEmpty() &&
        signedContractId != deviceId
    return isHangup || isAcceptedOnAnotherDevice
}
