package chat.rocket.reactnative.voip

import android.os.Handler
import android.os.Looper
import okhttp3.Request
import okhttp3.WebSocket
import okio.ByteString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import java.util.concurrent.TimeUnit

private class StubWebSocket : WebSocket {
    override fun request(): Request = Request.Builder().url("wss://example.com").build()
    override fun queueSize(): Long = 0
    override fun send(text: String): Boolean = true
    override fun send(bytes: ByteString): Boolean = true
    override fun close(code: Int, reason: String?): Boolean = true
    override fun cancel() {}
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class DDPClientTest {

    @Test
    fun `connected before connect timeout invokes callback exactly once`() {
        val client = DDPClient()
        val outcomes = mutableListOf<Boolean>()
        client.testStartConnectTimeout(10_000) { outcomes.add(it) }
        client.testDeliverRawMessage("""{"msg":"connected"}""")
        Shadows.shadowOf(Looper.getMainLooper()).idle()

        assertEquals(listOf(true), outcomes)

        Shadows.shadowOf(Looper.getMainLooper()).idleFor(11_000, TimeUnit.MILLISECONDS)
        assertEquals(listOf(true), outcomes)
    }

    @Test
    fun `cancelling connect timeout preserves other mainHandler runnables`() {
        val client = DDPClient()
        val looper = Shadows.shadowOf(Looper.getMainLooper())
        val connectOutcomes = mutableListOf<Boolean>()

        var secondaryFired = false
        Handler(Looper.getMainLooper()).postDelayed({ secondaryFired = true }, 15_000)

        client.testStartConnectTimeout(10_000) { connectOutcomes.add(it) }
        client.testDeliverRawMessage("""{"msg":"connected"}""")
        looper.idle()

        assertEquals(listOf(true), connectOutcomes)
        assertFalse(secondaryFired)

        looper.idleFor(20_000, TimeUnit.MILLISECONDS)
        assertTrue(secondaryFired)
    }

    @Test
    fun `connect timeout without connected posts false once`() {
        val client = DDPClient()
        val outcomes = mutableListOf<Boolean>()
        client.testStartConnectTimeout(5_000) { outcomes.add(it) }
        Shadows.shadowOf(Looper.getMainLooper()).idleFor(6_000, TimeUnit.MILLISECONDS)
        assertEquals(listOf(false), outcomes)
    }

    @Test
    fun `duplicate connected messages invoke handshake callback once`() {
        val client = DDPClient()
        val outcomes = mutableListOf<Boolean>()
        client.testStartConnectTimeout(10_000) { outcomes.add(it) }
        client.testDeliverRawMessage("""{"msg":"connected"}""")
        Shadows.shadowOf(Looper.getMainLooper()).idle()
        client.testDeliverRawMessage("""{"msg":"connected"}""")
        Shadows.shadowOf(Looper.getMainLooper()).idle()
        assertEquals(listOf(true), outcomes)
    }

    @Test
    fun `connection failure delivers false exactly once`() {
        val client = DDPClient()
        val outcomes = mutableListOf<Boolean>()
        val looper = Shadows.shadowOf(Looper.getMainLooper())

        client.testStartConnectTimeout(10_000) { outcomes.add(it) }
        client.testDeliverConnectFailure()
        looper.idle()

        assertEquals(listOf(false), outcomes)

        // duplicate failure must not re-deliver
        client.testDeliverConnectFailure()
        looper.idle()
        assertEquals(listOf(false), outcomes)
    }

    @Test
    fun `stale failure after completed connect and disconnect is a no-op when no reconnect armed`() {
        // CAS-gate case: disconnect() no longer resets connectResultDelivered, so a late
        // failure arriving before any new connect() loses the CAS (delivered is still true
        // from the completed handshake).
        val client = DDPClient()
        val outcomes = mutableListOf<Boolean>()
        val looper = Shadows.shadowOf(Looper.getMainLooper())

        client.testStartConnectTimeout(10_000) { outcomes.add(it) }
        client.testDeliverRawMessage("""{"msg":"connected"}""")
        looper.idle()
        assertEquals(listOf(true), outcomes)

        // disconnect — must NOT reset connectResultDelivered
        client.disconnect()

        // stale failure from old socket arrives before any new connect arms a callback
        client.testDeliverConnectFailure()
        looper.idle()

        // delivered was still true → CAS fails → no spurious false
        assertEquals(listOf(true), outcomes)
    }

    @Test
    fun `stale failure during reconnect window does not hijack new callback`() {
        // Real-hijack-vector regression: L1 onFailure queues a main-thread runnable while L1
        // is still current. Before the runnable executes, user disconnects and reconnects.
        // connect2 calls resetConnectHandshakeState() (delivered=false) and installs cb2.
        // Without the re-check inside the main-handler post, the stale runnable would win
        // the CAS and hijack cb2 with false. The inner identity check in onFailure's post
        // must reject the stale failure.
        val client = DDPClient()
        val oldSocket = StubWebSocket()
        val newSocket = StubWebSocket()
        val cb1Outcomes = mutableListOf<Boolean>()
        val cb2Outcomes = mutableListOf<Boolean>()
        val looper = Shadows.shadowOf(Looper.getMainLooper())

        // connect1 with oldSocket succeeds
        client.testSetActiveWebSocket(oldSocket)
        client.testStartConnectTimeout(10_000) { cb1Outcomes.add(it) }
        client.testDeliverRawMessage("""{"msg":"connected"}""")
        looper.idle()
        assertEquals(listOf(true), cb1Outcomes)

        // Simulate onFailure from oldSocket queuing a failure runnable
        // (outer guard passed; runnable is now on main handler awaiting execution)
        client.testDeliverConnectFailure(oldSocket)

        // Before the runnable runs: quick disconnect + reconnect
        client.disconnect()
        client.testSetActiveWebSocket(newSocket)
        client.testStartConnectTimeout(10_000) { cb2Outcomes.add(it) }

        // Flush the queued stale failure
        looper.idle()

        // cb2 must NOT receive a spurious false — the inner identity check must reject
        assertEquals(emptyList<Boolean>(), cb2Outcomes)

        // connect2's own timeout still fires normally
        looper.idleFor(11_000, TimeUnit.MILLISECONDS)
        assertEquals(listOf(false), cb2Outcomes)
    }
}
