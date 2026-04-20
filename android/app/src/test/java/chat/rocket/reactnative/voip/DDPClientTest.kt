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
}
