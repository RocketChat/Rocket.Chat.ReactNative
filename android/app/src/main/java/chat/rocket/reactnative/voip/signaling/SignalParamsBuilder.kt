package chat.rocket.reactnative.voip.signaling

import org.json.JSONArray

/**
 * Builds DDP-compatible JSON signal params.
 * Extracted from CallSignal.toDdpParams() to allow mocking in unit tests,
 * since org.json.JSONArray.put() is a native Android method that cannot be
 * mocked on the JVM without Robolectric or mockk-agent instrumentation.
 */
interface SignalParamsBuilder {
    /**
     * @param userId The authenticated user ID
     * @param callId The call identifier
     * @param contractId The device/contract identifier
     * @param answer "accept" or "reject"
     * @param supportedFeatures Optional list of supported feature strings
     * @return JSONArray ["/userId/media-calls", signalJsonString]
     */
    fun buildParams(
        userId: String,
        callId: String,
        contractId: String,
        answer: String,
        supportedFeatures: List<String>? = null
    ): JSONArray
}
