package chat.rocket.reactnative.voip.ddp

import org.json.JSONArray
import org.json.JSONObject

interface DdpClient {
    var onCollectionMessage: ((JSONObject) -> Unit)?
    fun connect(host: String, callback: (Boolean) -> Unit)
    fun login(token: String, callback: (Boolean) -> Unit)
    fun subscribe(name: String, params: JSONArray, callback: (Boolean) -> Unit)
    fun callMethod(method: String, params: JSONArray, callback: (Boolean) -> Unit)
    fun queueMethodCall(method: String, params: JSONArray, callback: (Boolean) -> Unit = {})
    fun hasQueuedMethodCalls(): Boolean
    fun flushQueuedMethodCalls()
    fun clearQueuedMethodCalls()
    fun disconnect()
}
