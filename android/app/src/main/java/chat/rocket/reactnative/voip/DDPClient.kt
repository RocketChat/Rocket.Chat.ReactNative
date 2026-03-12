package chat.rocket.reactnative.voip

import android.os.Handler
import android.os.Looper
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Minimal DDP WebSocket client for listening to Rocket.Chat media-signal events from native Android.
 * Only implements the subset needed to detect call hangup: connect, login, subscribe, and ping/pong.
 */
class DDPClient {

    companion object {
        private const val TAG = "RocketChat.DDPClient"
    }

    private var webSocket: WebSocket? = null
    private var client: OkHttpClient? = null
    private var sendCounter = 0
    private var isConnected = false
    private val mainHandler = Handler(Looper.getMainLooper())

    private val pendingCallbacks = mutableMapOf<String, (JSONObject) -> Unit>()
    private var connectedCallback: ((Boolean) -> Unit)? = null

    var onCollectionMessage: ((JSONObject) -> Unit)? = null

    fun connect(host: String, callback: (Boolean) -> Unit) {
        val wsUrl = buildWebSocketURL(host)

        Log.d(TAG, "Connecting to $wsUrl")

        val httpClient = OkHttpClient.Builder()
            .pingInterval(30, TimeUnit.SECONDS)
            .build()
        client = httpClient

        val request = Request.Builder().url(wsUrl).build()

        webSocket = httpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket opened")
                val connectMsg = JSONObject().apply {
                    put("msg", "connect")
                    put("version", "1")
                    put("support", JSONArray().apply {
                        put("1"); put("pre2"); put("pre1")
                    })
                }
                webSocket.send(connectMsg.toString())
                waitForConnected(10_000L, callback)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}")
                mainHandler.post { callback(false) }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code $reason")
            }
        })
    }

    fun login(token: String, callback: (Boolean) -> Unit) {
        val msg = nextMessage("method").apply {
            put("method", "login")
            put("params", JSONArray().apply {
                put(JSONObject().apply { put("resume", token) })
            })
        }

        val msgId = msg.getString("id")

        synchronized(pendingCallbacks) {
            pendingCallbacks[msgId] = { data ->
                synchronized(pendingCallbacks) { pendingCallbacks.remove(msgId) }
                val hasError = data.has("error")
                if (hasError) {
                    Log.e(TAG, "Login failed: ${data.opt("error")}")
                } else {
                    Log.d(TAG, "Login succeeded")
                }
                mainHandler.post { callback(!hasError) }
            }
        }

        if (!send(msg)) {
            mainHandler.post { callback(false) }
        }
    }

    fun subscribe(name: String, params: JSONArray, callback: (Boolean) -> Unit) {
        val msg = nextMessage("sub").apply {
            put("name", name)
            put("params", params)
        }

        val msgId = msg.getString("id")

        synchronized(pendingCallbacks) {
            pendingCallbacks[msgId] = {
                synchronized(pendingCallbacks) { pendingCallbacks.remove(msgId) }
                Log.d(TAG, "Subscribed to $name")
                mainHandler.post { callback(true) }
            }
        }

        if (!send(msg)) {
            mainHandler.post { callback(false) }
        }
    }

    fun disconnect() {
        Log.d(TAG, "Disconnecting")
        isConnected = false
        synchronized(pendingCallbacks) { pendingCallbacks.clear() }
        connectedCallback = null
        onCollectionMessage = null
        webSocket?.close(1000, null)
        webSocket = null
        client?.dispatcher?.executorService?.shutdown()
        client = null
    }

    private fun nextMessage(msg: String): JSONObject {
        sendCounter++
        return JSONObject().apply {
            put("msg", msg)
            put("id", "ddp-$sendCounter")
        }
    }

    private fun send(json: JSONObject): Boolean {
        val ws = webSocket ?: return false
        return ws.send(json.toString())
    }

    private fun waitForConnected(timeoutMs: Long, callback: (Boolean) -> Unit) {
        connectedCallback = callback
        mainHandler.postDelayed({
            val cb = connectedCallback ?: return@postDelayed
            connectedCallback = null
            Log.e(TAG, "Connect timeout")
            cb(false)
        }, timeoutMs)
    }

    private fun handleMessage(text: String) {
        val json = try {
            JSONObject(text)
        } catch (e: Exception) {
            return
        }

        when (json.optString("msg")) {
            "connected" -> {
                isConnected = true
                mainHandler.removeCallbacksAndMessages(null)
                val cb = connectedCallback
                connectedCallback = null
                cb?.let { mainHandler.post { it(true) } }
            }

            "ping" -> {
                send(JSONObject().apply { put("msg", "pong") })
            }

            "result" -> {
                val id = json.optString("id")
                val cb = synchronized(pendingCallbacks) { pendingCallbacks[id] }
                cb?.invoke(json)
            }

            "ready" -> {
                val subs = json.optJSONArray("subs")
                val first = subs?.optString(0)
                if (first != null) {
                    val cb = synchronized(pendingCallbacks) { pendingCallbacks[first] }
                    cb?.invoke(json)
                }
            }

            "changed", "added", "removed" -> {
                onCollectionMessage?.invoke(json)
            }

            "nosub" -> {
                val id = json.optString("id")
                val cb = synchronized(pendingCallbacks) { pendingCallbacks[id] }
                cb?.invoke(json)
            }

            else -> {
                if (json.has("collection")) {
                    onCollectionMessage?.invoke(json)
                }
            }
        }
    }

    private fun buildWebSocketURL(host: String): String {
        var normalizedHost = host.trimEnd('/')

        val useSsl: Boolean
        when {
            normalizedHost.startsWith("https://") -> {
                useSsl = true
                normalizedHost = normalizedHost.removePrefix("https://")
            }
            normalizedHost.startsWith("http://") -> {
                useSsl = false
                normalizedHost = normalizedHost.removePrefix("http://")
            }
            else -> {
                useSsl = true
            }
        }

        val scheme = if (useSsl) "wss" else "ws"
        return "$scheme://$normalizedHost/websocket"
    }
}
