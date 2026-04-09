package chat.rocket.reactnative.voip.ddp

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

class DdpClientImpl(
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .build()
) : DdpClient {

    private data class QueuedMethodCall(
        val method: String,
        val params: JSONArray,
        val callback: (Boolean) -> Unit
    )

    companion object {
        private const val TAG = "RocketChat.DdpClient"
    }

    private var webSocket: WebSocket? = null
    private var sendCounter = 0
    private var isConnected = false
    private val mainHandler = Handler(Looper.getMainLooper())

    private val pendingCallbacks = mutableMapOf<String, (JSONObject) -> Unit>()
    private val queuedMethodCalls = mutableListOf<QueuedMethodCall>()
    private var connectedCallback: ((Boolean) -> Unit)? = null

    override var onCollectionMessage: ((JSONObject) -> Unit)? = null

    override fun connect(host: String, callback: (Boolean) -> Unit) {
        val wsUrl = buildWebSocketURL(host)

        Log.d(TAG, "Connecting to $wsUrl")

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
                isConnected = false
                mainHandler.post { callback(false) }
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code $reason")
                isConnected = false
            }
        })
    }

    override fun login(token: String, callback: (Boolean) -> Unit) {
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

    override fun subscribe(name: String, params: JSONArray, callback: (Boolean) -> Unit) {
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

    override fun disconnect() {
        Log.d(TAG, "Disconnecting")
        isConnected = false
        synchronized(pendingCallbacks) { pendingCallbacks.clear() }
        clearQueuedMethodCalls()
        connectedCallback = null
        onCollectionMessage = null
        webSocket?.close(1000, null)
        webSocket = null
        httpClient.dispatcher.executorService.shutdown()
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

    override fun callMethod(method: String, params: JSONArray, callback: (Boolean) -> Unit) {
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

    override fun queueMethodCall(method: String, params: JSONArray, callback: (Boolean) -> Unit) {
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

    override fun hasQueuedMethodCalls(): Boolean =
        synchronized(queuedMethodCalls) { queuedMethodCalls.isNotEmpty() }

    override fun flushQueuedMethodCalls() {
        val queuedCalls = synchronized(queuedMethodCalls) {
            queuedMethodCalls.toList().also { queuedMethodCalls.clear() }
        }

        queuedCalls.forEach { queuedCall ->
            callMethod(queuedCall.method, queuedCall.params, queuedCall.callback)
        }
    }

    override fun clearQueuedMethodCalls() {
        synchronized(queuedMethodCalls) {
            queuedMethodCalls.clear()
        }
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
