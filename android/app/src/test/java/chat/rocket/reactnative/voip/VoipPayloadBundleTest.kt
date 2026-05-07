package chat.rocket.reactnative.voip

import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class VoipPayloadBundleTest {

    @Test
    fun `toBundle includes voipAcceptFailed for process death round trip`() {
        val createdAt = "2026-01-01T00:00:00.000Z"
        val payload = VoipPayload(
            callId = "call-1",
            caller = "Caller",
            username = "user1",
            host = "https://example.com",
            type = VoipPushType.INCOMING_CALL.value,
            hostName = "Example",
            avatarUrl = null,
            createdAt = createdAt,
            voipAcceptFailed = true,
        )

        val bundle = payload.toBundle()
        assertTrue(bundle.containsKey("voipAcceptFailed"))
        assertTrue(bundle.getBoolean("voipAcceptFailed", false))

        val restored = VoipPayload.fromBundle(bundle)
        assertNotNull(restored)
        assertTrue(restored!!.voipAcceptFailed)
    }

    @Test
    fun `toBundle round trips voipAcceptFailed false`() {
        val createdAt = "2026-01-01T00:00:00.000Z"
        val payload = VoipPayload(
            callId = "call-2",
            caller = "Caller",
            username = "user1",
            host = "https://example.com",
            type = VoipPushType.INCOMING_CALL.value,
            hostName = "Example",
            avatarUrl = null,
            createdAt = createdAt,
            voipAcceptFailed = false,
        )

        val bundle = payload.toBundle()
        assertFalse(bundle.getBoolean("voipAcceptFailed", true))

        val restored = VoipPayload.fromBundle(bundle)
        assertNotNull(restored)
        assertFalse(restored!!.voipAcceptFailed)
    }
}
