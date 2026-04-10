package chat.rocket.reactnative.voip.signaling

import org.json.JSONArray
import org.json.JSONObject

/**
 * Default implementation of SignalParamsBuilder using org.json.* classes.
 * Production code uses this; tests inject a mock.
 */
class DefaultSignalParamsBuilder : SignalParamsBuilder {

    override fun buildParams(
        userId: String,
        callId: String,
        contractId: String,
        answer: String,
        supportedFeatures: List<String>?
    ): JSONArray {
        val signalJson = JSONObject().apply {
            put("callId", callId)
            put("contractId", contractId)
            put("type", "answer")
            put("answer", answer)
            supportedFeatures?.let {
                put("supportedFeatures", it)
            }
        }
        return JSONArray().apply {
            put("$userId/media-calls")
            put(signalJson.toString())
        }
    }
}
