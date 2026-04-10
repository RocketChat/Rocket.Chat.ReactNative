package chat.rocket.reactnative.voip.signaling

import android.content.Context
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import org.json.JSONArray

class DefaultCallSignalBuilder(
    private val credentialsProvider: VoipCredentialsProvider,
    private val paramsBuilder: SignalParamsBuilder = DefaultSignalParamsBuilder()
) : CallSignalBuilder {

    companion object {
        private const val SUPPORTED_VOIP_FEATURES = "audio"
    }

    override fun buildAcceptSignal(context: Context, payload: VoipPayload): JSONArray? {
        val identity = resolveIdentity(payload) ?: return null
        return paramsBuilder.buildParams(
            userId = identity.userId,
            callId = payload.callId,
            contractId = identity.deviceId,
            answer = "accept",
            supportedFeatures = listOf(SUPPORTED_VOIP_FEATURES)
        )
    }

    override fun buildRejectSignal(context: Context, payload: VoipPayload): JSONArray? {
        val identity = resolveIdentity(payload) ?: return null
        return paramsBuilder.buildParams(
            userId = identity.userId,
            callId = payload.callId,
            contractId = identity.deviceId,
            answer = "reject",
            supportedFeatures = null
        )
    }

    private fun resolveIdentity(payload: VoipPayload): VoipMediaCallIdentity? {
        val userId = credentialsProvider.userId()
        if (userId.isNullOrEmpty()) {
            return null
        }
        val deviceId = credentialsProvider.deviceId()
        if (deviceId.isEmpty()) {
            return null
        }
        return VoipMediaCallIdentity(userId, deviceId)
    }
}
