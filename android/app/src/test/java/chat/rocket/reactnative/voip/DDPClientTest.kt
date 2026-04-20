package chat.rocket.reactnative.voip

import android.os.Handler
import android.os.Looper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import java.util.concurrent.TimeUnit

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
    fun `stale failure after completed connect and disconnect is a no-op`() {
        // Regression: disconnect() previously reset connectResultDelivered, allowing a late
        // onFailure from the old socket to win the CAS and invoke a newly installed callback.
        // Fix: remove the reset from disconnect(); the stale-listener guard in onFailure()
        // is the primary defence, but keeping delivered=true also protects the window before
        // a new connect() rearms the state.
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
}
