package chat.rocket.reactnative.voip

import org.junit.Assert.assertEquals
import org.junit.Test

class VoipIncomingCallDispatchTest {

    @Test
    fun `stale push with active call does not route to reject busy`() {
        assertEquals(
            VoipIncomingPushAction.STALE,
            decideIncomingVoipPushAction(isValidForIncomingHandling = false, hasActiveCall = true)
        )
    }

    @Test
    fun `stale push without active call does not route to show incoming`() {
        assertEquals(
            VoipIncomingPushAction.STALE,
            decideIncomingVoipPushAction(isValidForIncomingHandling = false, hasActiveCall = false)
        )
    }

    @Test
    fun `valid push with active call rejects busy`() {
        assertEquals(
            VoipIncomingPushAction.REJECT_BUSY,
            decideIncomingVoipPushAction(isValidForIncomingHandling = true, hasActiveCall = true)
        )
    }

    @Test
    fun `valid push without active call shows incoming`() {
        assertEquals(
            VoipIncomingPushAction.SHOW_INCOMING,
            decideIncomingVoipPushAction(isValidForIncomingHandling = true, hasActiveCall = false)
        )
    }

    @Test
    fun `signal with foreign signedContractId without accepted notification does not dismiss call`() {
        // Issue #7702: In external SIP/FreeSWITCH calls, trunk/server contract ID is broadcast
        // without an "accepted" notification. Must NOT trigger premature call dismissal.
        assertEquals(
            false,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = null,
                signedContractId = "external-sip-trunk-contract-id",
                deviceId = "my-device-id"
            )
        )
        assertEquals(
            false,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "negotiating",
                signedContractId = "external-sip-trunk-contract-id",
                deviceId = "my-device-id"
            )
        )
    }

    @Test
    fun `signal with foreign signedContractId and accepted notification dismisses call`() {
        // Multi-device: Legitimate acceptance on another device dismisses this device's incoming UI
        assertEquals(
            true,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "accepted",
                signedContractId = "other-device-id",
                deviceId = "my-device-id"
            )
        )
    }

    @Test
    fun `signal with same deviceId and accepted notification does not dismiss call`() {
        // Acceptance on this device must not dismiss as "accepted from other device"
        assertEquals(
            false,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "accepted",
                signedContractId = "my-device-id",
                deviceId = "my-device-id"
            )
        )
    }

    @Test
    fun `signal with hangup notification dismisses call`() {
        // Caller hung up
        assertEquals(
            true,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "hangup",
                signedContractId = null,
                deviceId = "my-device-id"
            )
        )
        assertEquals(
            true,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "hangup",
                signedContractId = "any-contract-id",
                deviceId = "my-device-id"
            )
        )
    }

    @Test
    fun `signal with non-notification type does not dismiss call`() {
        assertEquals(
            false,
            shouldDismissIncomingCallOnSignal(
                signalType = "offer",
                signalNotification = "hangup",
                signedContractId = "other-device-id",
                deviceId = "my-device-id"
            )
        )
    }

    @Test
    fun `signal with empty or null signedContractId and accepted notification does not dismiss call`() {
        assertEquals(
            false,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "accepted",
                signedContractId = null,
                deviceId = "my-device-id"
            )
        )
        assertEquals(
            false,
            shouldDismissIncomingCallOnSignal(
                signalType = "notification",
                signalNotification = "accepted",
                signedContractId = "",
                deviceId = "my-device-id"
            )
        )
    }
}
