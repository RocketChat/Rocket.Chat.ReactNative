package chat.rocket.reactnative.voip

import android.os.Looper
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = VoipTestApplication::class)
class DDPClientTest {

    private lateinit var mockWebServer: MockWebServer

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()
    }

    @After
    fun tearDown() {
        if (::mockWebServer.isInitialized) {
            try {
                mockWebServer.shutdown()
            } catch (_: Exception) {
                // OkHttp MockWebServer can throw if a WebSocket is still closing.
            }
        }
    }

    private fun httpHost(): String = "http://${mockWebServer.hostName}:${mockWebServer.port}/"

    /** OkHttp posts DDP results to the main looper; pump until [latch] completes or timeout. */
    private fun awaitMain(latch: CountDownLatch, timeoutMs: Long): Boolean {
        val shadow = Shadows.shadowOf(Looper.getMainLooper())
        val end = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < end) {
            shadow.idleFor(25, TimeUnit.MILLISECONDS)
            if (latch.count == 0L) {
                return true
            }
        }
        return latch.await(0, TimeUnit.MILLISECONDS)
    }

    private fun enqueueWebSocketEchoServer() {
        mockWebServer.enqueue(
            MockResponse().withWebSocketUpgrade(
                object : WebSocketListener() {
                    override fun onMessage(webSocket: WebSocket, text: String) {
                        val json = JSONObject(text)
                        when (json.optString("msg")) {
                            "connect" -> webSocket.send("""{"msg":"connected","session":"test-session"}""")
                            "method" -> {
                                val id = json.getString("id")
                                val method = json.optString("method")
                                if (method == "login") {
                                    webSocket.send("""{"msg":"result","id":"$id","result":{}}""")
                                } else {
                                    webSocket.send("""{"msg":"result","id":"$id","result":{}}""")
                                }
                            }
                            "sub" -> {
                                val id = json.getString("id")
                                webSocket.send("""{"msg":"ready","subs":["$id"]}""")
                            }
                            "pong" -> Unit
                        }
                    }
                }
            )
        )
    }

    @Test
    fun `connect completes after server sends connected`() {
        enqueueWebSocketEchoServer()
        val client = DDPClient()
        val latch = CountDownLatch(1)
        var ok: Boolean? = null
        client.connect(httpHost()) { success ->
            assertTrue(Looper.getMainLooper().isCurrentThread)
            ok = success
            latch.countDown()
        }
        assertTrue(awaitMain(latch, 20_000))
        assertTrue(ok!!)
        client.disconnect()
    }

    @Test
    fun `login succeeds after connect`() {
        enqueueWebSocketEchoServer()
        val client = DDPClient()
        val connectLatch = CountDownLatch(1)
        client.connect(httpHost()) { connectLatch.countDown() }
        assertTrue(awaitMain(connectLatch, 20_000))

        val loginLatch = CountDownLatch(1)
        var loginOk: Boolean? = null
        client.login("resume-token") { success ->
            loginOk = success
            loginLatch.countDown()
        }
        assertTrue(awaitMain(loginLatch, 20_000))
        assertTrue(loginOk!!)
        client.disconnect()
    }

    @Test
    fun `disconnect prevents further login`() {
        enqueueWebSocketEchoServer()
        val client = DDPClient()
        val connectLatch = CountDownLatch(1)
        client.connect(httpHost()) { connectLatch.countDown() }
        assertTrue(awaitMain(connectLatch, 20_000))

        client.disconnect()

        val loginLatch = CountDownLatch(1)
        var loginOk: Boolean? = null
        client.login("resume-token") { success ->
            loginOk = success
            loginLatch.countDown()
        }
        assertTrue(awaitMain(loginLatch, 10_000))
        assertFalse(loginOk!!)
    }

    @Test
    fun `login with error result posts false`() {
        mockWebServer.enqueue(
            MockResponse().withWebSocketUpgrade(
                object : WebSocketListener() {
                    override fun onMessage(webSocket: WebSocket, text: String) {
                        val json = JSONObject(text)
                        when (json.optString("msg")) {
                            "connect" -> webSocket.send("""{"msg":"connected","session":"s"}""")
                            "method" -> {
                                val id = json.getString("id")
                                webSocket.send(
                                    """{"msg":"result","id":"$id","error":{"reason":"nope"}}"""
                                )
                            }
                        }
                    }
                }
            )
        )
        val client = DDPClient()
        val connectLatch = CountDownLatch(1)
        client.connect(httpHost()) { connectLatch.countDown() }
        assertTrue(awaitMain(connectLatch, 20_000))

        val loginLatch = CountDownLatch(1)
        var loginOk: Boolean? = null
        client.login("bad") { success ->
            loginOk = success
            loginLatch.countDown()
        }
        assertTrue(awaitMain(loginLatch, 20_000))
        assertFalse(loginOk!!)
        client.disconnect()
    }

    @Test
    fun `subscribe receives ready`() {
        enqueueWebSocketEchoServer()
        val client = DDPClient()
        val connectLatch = CountDownLatch(1)
        client.connect(httpHost()) { connectLatch.countDown() }
        assertTrue(awaitMain(connectLatch, 20_000))

        val subLatch = CountDownLatch(1)
        var subOk: Boolean? = null
        client.subscribe("stream-notify-user", JSONArray().put("x")) { ok ->
            subOk = ok
            subLatch.countDown()
        }
        assertTrue(awaitMain(subLatch, 20_000))
        assertTrue(subOk!!)
        client.disconnect()
    }
}
