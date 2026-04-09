package chat.rocket.reactnative.voip.signaling

import org.json.JSONArray
import org.json.JSONObject

/**
 * Represents a call signal message sent via DDP stream-notify-user.
 */
data class CallSignal(
    val callId: String,
    val contractId: String,
    val type: String,
    val answer: String,
    val supportedFeatures: List<String>? = null
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("callId", callId)
        put("contractId", contractId)
        put("type", type)
        put("answer", answer)
        supportedFeatures?.let {
            put("supportedFeatures", it)
        }
    }

    fun toDdpParams(userId: String): JSONArray {
        return org.json.JSONArray().apply {
            put("${userId}/media-calls")
            put(toJson().toString())
        }
    }
}
