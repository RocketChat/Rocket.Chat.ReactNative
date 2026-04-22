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
import chat.rocket.reactnative.networking.SSLPinningTurboModule
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class DDPClient {
    private data class QueuedMethodCall(
        val method: String,
        val params: JSONArray,
        val callback: (Boolean) -> Unit
    )

    companion object {
        private const val TAG = "RocketChat.DDPClient"
        private val sharedClient: OkHttpClient by lazy {
            SSLPinningTurboModule.getSharedOkHttpClient() ?: OkHttpClient.Builder()
                .pingInterval(30, TimeUnit.SECONDS)
                .build()
        }
    }

    private var webSocket: WebSocket? = null
    private val client: OkHttpClient = sharedClient
    private val sendCounter = AtomicInteger(0)

    @Volatile
    private var isConnected = false

    private val mainHandler = Handler(Looper.getMainLooper())

    private val pendingCallbacks = mutableMapOf<String, (JSONObject) -> Unit>()
    private val queuedMethodCalls = mutableListOf<QueuedMethodCall>()

    @Volatile
    private var connectedCallback: ((Boolean) -> Unit)? = null

    @Volatile
    private var connectTimeoutRunnable: Runnable? = null

    private val connectResultDelivered = AtomicBoolean(false)

    var onCollectionMessage: ((JSONObject) -> Unit)? = null

    fun connect(host: String, callback: (Boolean) -> Unit) {
        resetConnectHandshakeState()

        val wsUrl = buildWebSocketURL(host)

        Log.d(TAG, "Connecting to $wsUrl")

        val request = Request.Builder().url(wsUrl).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
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
                if (webSocket !== this@DDPClient.webSocket) return
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                if (webSocket !== this@DDPClient.webSocket) return
                Log.e(TAG, "WebSocket failure: ${t.message}")
                isConnected = false
                mainHandler.post {
                    // Re-check identity on main thread: disconnect()+connect() can interleave
                    // between the outer guard (OkHttp thread) and this runnable's execution.
                    // Without this re-check, a stale failure can hijack a newly installed
                    // connectedCallback via the CAS in tryDeliverConnectOutcome.
                    if (webSocket !== this@DDPClient.webSocket) return@post
                    tryDeliverConnectOutcome(false)
                }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (webSocket !== this@DDPClient.webSocket) return
                Log.d(TAG, "WebSocket closed: $code $reason")
                isConnected = false
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
            pendingCallbacks[msgId] = { data ->
                synchronized(pendingCallbacks) { pendingCallbacks.remove(msgId) }
                val didSubscribe = data.optString("msg") == "ready" && !data.has("error")
                if (didSubscribe) {
                    Log.d(TAG, "Subscribed to $name")
                } else {
                    Log.e(TAG, "Failed to subscribe to $name: ${data.opt("error") ?: "nosub"}")
                }
                mainHandler.post { callback(didSubscribe) }
            }
        }

        if (!send(msg)) {
            synchronized(pendingCallbacks) { pendingCallbacks.remove(msgId) }
            mainHandler.post { callback(false) }
        }
    }

    fun disconnect() {
        Log.d(TAG, "Disconnecting")
        isConnected = false
        cancelConnectTimeout()
        synchronized(pendingCallbacks) { pendingCallbacks.clear() }
        clearQueuedMethodCalls()
        connectedCallback = null
        onCollectionMessage = null
        webSocket?.close(1000, null)
        webSocket = null
    }

    private fun nextMessage(msg: String): JSONObject {
        val nextId = sendCounter.incrementAndGet()
        return JSONObject().apply {
            put("msg", msg)
            put("id", "ddp-$nextId")
        }
    }

    private fun send(json: JSONObject): Boolean {
        val ws = webSocket ?: return false
        return ws.send(json.toString())
    }

    fun callMethod(method: String, params: JSONArray, callback: (Boolean) -> Unit) {
        val msg = nextMessage("method").apply {
            put("method", method)
            put("params", params)
        }

        val msgId = msg.getString("id")

        synchronized(pendingCallbacks) {
            pendingCallbacks[msgId] = { data ->
                synchronized(pendingCallbacks) { pendingCallbacks.remove(msgId) }
                val hasError = data.has("error")
                if (hasError) {
                    Log.e(TAG, "Method $method failed: ${data.opt("error")}")
                }
                mainHandler.post { callback(!hasError) }
            }
        }

        if (!send(msg)) {
            synchronized(pendingCallbacks) { pendingCallbacks.remove(msgId) }
            mainHandler.post { callback(false) }
        }
    }

    fun queueMethodCall(method: String, params: JSONArray, callback: (Boolean) -> Unit = {}) {
        synchronized(queuedMethodCalls) {
            queuedMethodCalls.add(
                QueuedMethodCall(
                    method = method,
                    params = params,
                    callback = callback
                )
            )
        }
    }

    fun hasQueuedMethodCalls(): Boolean =
        synchronized(queuedMethodCalls) { queuedMethodCalls.isNotEmpty() }

    fun flushQueuedMethodCalls() {
        val queuedCalls = synchronized(queuedMethodCalls) {
            queuedMethodCalls.toList().also { queuedMethodCalls.clear() }
        }

        queuedCalls.forEach { queuedCall ->
            callMethod(queuedCall.method, queuedCall.params, queuedCall.callback)
        }
    }

    fun clearQueuedMethodCalls() {
        synchronized(queuedMethodCalls) {
            queuedMethodCalls.clear()
        }
    }

    private fun resetConnectHandshakeState() {
        connectResultDelivered.set(false)
    }

    /**
     * Delivers at most one outcome for the WebSocket connect handshake ([connect] callback).
     * Uses [AtomicBoolean] so [onFailure], the connect-timeout runnable, and `"connected"` cannot
     * all report conflicting results.
     */
    private fun tryDeliverConnectOutcome(success: Boolean, connectTimeout: Boolean = false) {
        if (!connectResultDelivered.compareAndSet(false, true)) {
            return
        }
        cancelConnectTimeout()
        val cb = connectedCallback
        connectedCallback = null
        if (connectTimeout) {
            Log.e(TAG, "Connect timeout")
        }
        mainHandler.post {
            cb?.invoke(success)
        }
    }

    private fun waitForConnected(timeoutMs: Long, callback: (Boolean) -> Unit) {
        connectedCallback = callback
        cancelConnectTimeout()
        val runnable = Runnable {
            connectTimeoutRunnable = null
            tryDeliverConnectOutcome(false, connectTimeout = true)
        }
        connectTimeoutRunnable = runnable
        mainHandler.postDelayed(runnable, timeoutMs)
    }

    private fun cancelConnectTimeout() {
        connectTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        connectTimeoutRunnable = null
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
                tryDeliverConnectOutcome(true)
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
                if (subs != null) {
                    for (index in 0 until subs.length()) {
                        val subId = subs.optString(index)
                        if (subId.isEmpty()) {
                            continue
                        }

                        val cb = synchronized(pendingCallbacks) { pendingCallbacks[subId] }
                        cb?.invoke(json)
                    }
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
                throw IllegalStateException("DDPClient does not support plaintext http:// servers — use https://")
            }
            else -> {
                useSsl = true
            }
        }

        val scheme = if (useSsl) "wss" else "ws"
        return "$scheme://$normalizedHost/websocket"
    }

    internal fun testStartConnectTimeout(timeoutMs: Long, callback: (Boolean) -> Unit) {
        resetConnectHandshakeState()
        waitForConnected(timeoutMs, callback)
    }

    internal fun testDeliverRawMessage(text: String) {
        handleMessage(text)
    }

    internal fun testDeliverConnectFailure(fromWebSocket: WebSocket? = null) {
        mainHandler.post {
            if (fromWebSocket != null && fromWebSocket !== this@DDPClient.webSocket) return@post
            tryDeliverConnectOutcome(false)
        }
    }

    internal fun testSetActiveWebSocket(ws: WebSocket?) {
        this.webSocket = ws
    }
}
