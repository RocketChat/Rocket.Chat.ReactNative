package chat.rocket.reactnative.voip.ddp

import android.os.Looper
import android.util.Log
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class DdpClientImplTest {

    @Before
    fun setup() {
        mockkStatic(Looper::class)
        val mockLooper = mockk<Looper>()
        every { Looper.getMainLooper() } returns mockLooper

        mockkStatic("android.util.Log")
        every { Log.d(any(), any()) } returns 0
    }

    private fun createDdpClient(): DdpClientImpl {
        val mockWebSocket = mockk<WebSocket>(relaxed = true)
        val mockOkHttpClient = mockk<OkHttpClient>(relaxed = true)

        every { mockWebSocket.send(any<String>()) } returns true
        every { mockWebSocket.close(any(), any()) } returns true
        every { mockOkHttpClient.newWebSocket(any<Request>(), any<WebSocketListener>()) } returns mockWebSocket

        return DdpClientImpl(mockOkHttpClient)
    }

    // Test 1: queueMethodCall + hasQueuedMethodCalls returns true when queued
    @Test
    fun `hasQueuedMethodCalls returns true when queued`() {
        val client = createDdpClient()
        assertFalse(client.hasQueuedMethodCalls())
        client.queueMethodCall("method1", JSONArray())
        assertTrue(client.hasQueuedMethodCalls())
    }

    // Test 2: hasQueuedMethodCalls returns false when empty
    @Test
    fun `hasQueuedMethodCalls returns false when empty`() {
        val client = createDdpClient()
        assertFalse(client.hasQueuedMethodCalls())
        client.queueMethodCall("method1", JSONArray())
        assertTrue(client.hasQueuedMethodCalls())
        client.clearQueuedMethodCalls()
        assertFalse(client.hasQueuedMethodCalls())
    }

    // Test 3: multiple queued methods
    @Test
    fun `hasQueuedMethodCalls returns true with multiple queued`() {
        val client = createDdpClient()
        assertFalse(client.hasQueuedMethodCalls())
        client.queueMethodCall("method1", JSONArray())
        client.queueMethodCall("method2", JSONArray())
        assertTrue(client.hasQueuedMethodCalls())
    }

    // Test 4: queue cleared on disconnect
    @Test
    fun `queueMethodCall cleared on disconnect`() {
        val client = createDdpClient()
        client.queueMethodCall("method1", JSONArray())
        assertTrue(client.hasQueuedMethodCalls())
        client.disconnect()
        assertFalse(client.hasQueuedMethodCalls())
    }
}
