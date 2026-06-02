package chat.rocket.reactnative.voip

import android.os.Handler
import android.os.Looper
import android.util.Log
import chat.rocket.reactnative.notification.Ejson
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import chat.rocket.reactnative.networking.SSLPinningTurboModule
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * REST client for `POST /api/v1/media-calls.answer` used by accept/reject flows.
 *
 * Mirrors the iOS [MediaCallsAnswerRequest.swift][ios/Shared/RocketChat/API/MediaCallsAnswerRequest.swift]
 * and replaces the DDP `sendAcceptSignal` / `sendRejectSignal` / `queueAcceptSignal` / `queueRejectSignal`
 * methods in [VoipNotification].
 *
 * Auth headers (`x-user-id` / `x-auth-token`) are resolved from [Ejson] at call time,
 * matching the pattern used by [chat.rocket.reactnative.notification.ReplyBroadcast].
 *
 * [fetch]'s `onResult` is always invoked on the main thread.
 *
 * @param callId       The call identifier from the VoIP payload.
 * @param contractId   The device-unique contract identifier (`Settings.Secure.ANDROID_ID`).
 * @param answer       Either `"accept"` or `"reject"`.
 * @param supportedFeatures Optional list of supported features (e.g. `["audio"]`); sent only for accept.
 */
class MediaCallsAnswerRequest(
    private val callId: String,
    private val contractId: String,
    private val answer: String,
    private val supportedFeatures: List<String>? = null
) {
    companion object {
        private const val TAG = "RocketChat.MediaCallsAnswerRequest"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
        private val httpClient: OkHttpClient by lazy {
            val base = SSLPinningTurboModule.getSharedOkHttpClient() ?: OkHttpClient()
            base.newBuilder()
                .callTimeout(10, TimeUnit.SECONDS)
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build()
        }
        private val mainHandler = Handler(Looper.getMainLooper())

        @JvmStatic
        fun fetch(
            context: android.content.Context,
            host: String,
            callId: String,
            contractId: String,
            answer: String,
            supportedFeatures: List<String>? = null,
            onResult: (Boolean) -> Unit
        ) {
            val request = MediaCallsAnswerRequest(callId, contractId, answer, supportedFeatures)
            request.execute(context, host, onResult)
        }
    }

    /**
     * Builds the JSON body for the request:
     * ```json
     * {
     *   "callId": "<callId>",
     *   "contractId": "<contractId>",
     *   "answer": "<accept|reject>",
     *   "supportedFeatures": ["audio"]  // only when non-null for accept
     * }
     * ```
     */
    private fun buildBody(): JSONObject {
        val json = JSONObject().apply {
            put("callId", callId)
            put("contractId", contractId)
            put("answer", answer)
        }
        supportedFeatures?.let { features ->
            val arr = JSONArray()
            features.forEach { arr.put(it) }
            json.put("supportedFeatures", arr)
        }
        return json
    }

    private fun execute(
        context: android.content.Context,
        host: String,
        onResult: (Boolean) -> Unit
    ) {
        val ejson = Ejson().apply { this.host = host }
        val userId = ejson.userId()
        val token = ejson.token()

        if (userId.isNullOrEmpty() || token.isNullOrEmpty()) {
            Log.w(TAG, "Missing credentials for $host — cannot send media-call answer")
            mainHandler.post { onResult(false) }
            return
        }

        val serverUrl = host.removeSuffix("/")
        val url = "$serverUrl/api/v1/media-calls.answer"

        val body = buildBody().toString()
        val requestBody = body.toRequestBody(JSON_MEDIA_TYPE)

        val request = Request.Builder()
            .header("x-user-id", userId)
            .header("x-auth-token", token)
            .url(url)
            .post(requestBody)
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "MediaCallsAnswerRequest failed for callId=$callId: ${e.message}")
                mainHandler.post { onResult(false) }
            }

            override fun onResponse(call: Call, response: okhttp3.Response) {
                response.use {
                    val success = it.code in 200..299
                    mainHandler.post { onResult(success) }
                }
            }
        })
    }
}
