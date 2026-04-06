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
}
