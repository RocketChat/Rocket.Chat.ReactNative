package chat.rocket.reactnative.voip.signaling

import android.content.Context
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import org.json.JSONArray

class DefaultCallSignalBuilder(
    private val credentialsProvider: VoipCredentialsProvider
) : CallSignalBuilder {

    companion object {
        private const val SUPPORTED_VOIP_FEATURES = "audio"
    }

    override fun buildAcceptSignal(context: Context, payload: VoipPayload): JSONArray? {
        val identity = resolveIdentity(payload) ?: return null
        val signal = CallSignal(
            callId = payload.callId,
            contractId = identity.deviceId,
            type = "answer",
            answer = "accept",
            supportedFeatures = listOf(SUPPORTED_VOIP_FEATURES)
        )
        return signal.toDdpParams(identity.userId)
    }

    override fun buildRejectSignal(context: Context, payload: VoipPayload): JSONArray? {
        val identity = resolveIdentity(payload) ?: return null
        val signal = CallSignal(
            callId = payload.callId,
            contractId = identity.deviceId,
            type = "answer",
            answer = "reject"
        )
        return signal.toDdpParams(identity.userId)
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
