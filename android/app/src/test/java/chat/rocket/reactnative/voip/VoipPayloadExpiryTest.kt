package chat.rocket.reactnative.voip

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class VoipPayloadExpiryTest {

    private val incomingCallLifetimeMs = 60_000L

    private fun isoString(epochMs: Long): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US)
        formatter.timeZone = TimeZone.getTimeZone("UTC")
        return formatter.format(java.util.Date(epochMs))
    }

    private fun makePayload(createdAt: String?): VoipPayload {
        return VoipPayload(
            callId = "call-1",
            caller = "Caller",
            username = "user1",
            host = "https://example.com",
            type = VoipPushType.INCOMING_CALL.value,
            hostName = "Example",
            avatarUrl = null,
            createdAt = createdAt,
            voipAcceptFailed = false,
        )
    }

    @Test
    fun `getRemainingLifetimeMs returns full lifetime when device clock is far ahead of createdAt`() {
        val createdAtMs = 1_700_000_000_000L
        val payload = makePayload(isoString(createdAtMs))
        // Device clock is 20 minutes ahead of createdAt -> skew exceeds threshold (10 min)
        val nowMs = createdAtMs + 20 * 60_000L
        assertEquals(incomingCallLifetimeMs, payload.getRemainingLifetimeMs(nowMs))
    }

    @Test
    fun `getRemainingLifetimeMs returns full lifetime when device clock is far behind createdAt`() {
        val createdAtMs = 1_700_000_000_000L
        val payload = makePayload(isoString(createdAtMs))
        // Device clock is 20 minutes behind createdAt -> skew exceeds threshold (10 min)
        val nowMs = createdAtMs - 20 * 60_000L
        assertEquals(incomingCallLifetimeMs, payload.getRemainingLifetimeMs(nowMs))
    }

    @Test
    fun `getRemainingLifetimeMs returns expected remaining when skew is small and call is fresh`() {
        val createdAtMs = 1_700_000_000_000L
        val payload = makePayload(isoString(createdAtMs))
        // 30s after createdAt -> ~30_000 ms remaining
        val nowMs = createdAtMs + 30_000L
        val remaining = payload.getRemainingLifetimeMs(nowMs)
        assertEquals(30_000L, remaining)
    }

    @Test
    fun `getRemainingLifetimeMs returns 0 when skew is small and call is stale`() {
        val createdAtMs = 1_700_000_000_000L
        val payload = makePayload(isoString(createdAtMs))
        // 70s after createdAt -> expired
        val nowMs = createdAtMs + 70_000L
        assertEquals(0L, payload.getRemainingLifetimeMs(nowMs))
    }

    @Test
    fun `getRemainingLifetimeMs returns null when createdAt is missing`() {
        val payload = makePayload(null)
        assertNull(payload.getRemainingLifetimeMs(System.currentTimeMillis()))
    }

    @Test
    fun `getRemainingLifetimeMs returns null when createdAt is unparseable`() {
        val payload = makePayload("not-a-date")
        assertNull(payload.getRemainingLifetimeMs(System.currentTimeMillis()))
    }

    @Test
    fun `isExpired follows getRemainingLifetimeMs across all skew scenarios`() {
        val createdAtMs = 1_700_000_000_000L
        val payload = makePayload(isoString(createdAtMs))

        // Far-ahead skew: device clock untrusted -> not expired
        assertFalse(payload.isExpired(createdAtMs + 20 * 60_000L))
        // Far-behind skew: device clock untrusted -> not expired
        assertFalse(payload.isExpired(createdAtMs - 20 * 60_000L))
        // Fresh call within trusted skew -> not expired
        assertFalse(payload.isExpired(createdAtMs + 30_000L))
        // Stale call within trusted skew -> expired
        assertTrue(payload.isExpired(createdAtMs + 70_000L))

        // Missing createdAt -> expired (remaining lifetime is null)
        val nullPayload = makePayload(null)
        assertTrue(nullPayload.isExpired(System.currentTimeMillis()))
    }
}
