package chat.rocket.reactnative.voip.signaling

import android.content.Context
import android.util.Log
import chat.rocket.reactnative.voip.ddp.DdpClient
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.VoipPerCallDdpRegistry
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider
import org.json.JSONArray

internal class DefaultCallSignalSender(
    private val ddpRegistry: VoipPerCallDdpRegistry<DdpClient>,
    private val credentialsProvider: VoipCredentialsProvider,
    private val paramsBuilder: SignalParamsBuilder = DefaultSignalParamsBuilder()
) : CallSignalSender {

    companion object {
        private const val TAG = "RocketChat.CallSignalSender"
        private const val SUPPORTED_VOIP_FEATURES = "audio"
    }

    override fun sendAccept(context: Context, payload: VoipPayload, onComplete: (Boolean) -> Unit) {
        val client = ddpRegistry.clientFor(payload.callId)
        if (client == null) {
            Log.d(TAG, "Native DDP client unavailable, cannot send accept for ${payload.callId}")
            onComplete(false)
            return
        }

        val params = buildAcceptSignalParams(context, payload) ?: run {
            onComplete(false)
            return
        }

        client.callMethod("stream-notify-user", params) { success ->
            Log.d(TAG, "Native accept signal result for ${payload.callId}: $success")
            onComplete(success)
        }
    }

    override fun queueAccept(context: Context, payload: VoipPayload, onComplete: (Boolean) -> Unit) {
        val client = ddpRegistry.clientFor(payload.callId)
        if (client == null) {
            Log.d(TAG, "Native DDP client unavailable, cannot queue accept for ${payload.callId}")
            onComplete(false)
            return
        }

        val params = buildAcceptSignalParams(context, payload) ?: run {
            onComplete(false)
            return
        }

        client.queueMethodCall("stream-notify-user", params) { success ->
            Log.d(TAG, "Queued native accept signal result for ${payload.callId}: $success")
            onComplete(success)
        }
        Log.d(TAG, "Queued native accept signal for ${payload.callId}")
    }

    override fun sendReject(context: Context, payload: VoipPayload) {
        val client = ddpRegistry.clientFor(payload.callId)
        if (client == null) {
            Log.d(TAG, "Native DDP client unavailable, cannot send reject for ${payload.callId}")
            return
        }

        val params = buildRejectSignalParams(context, payload) ?: return

        client.callMethod("stream-notify-user", params) { success ->
            Log.d(TAG, "Native reject signal result for ${payload.callId}: $success")
            ddpRegistry.stopClient(payload.callId)
        }
    }

    override fun queueReject(context: Context, payload: VoipPayload) {
        val client = ddpRegistry.clientFor(payload.callId)
        if (client == null) {
            Log.d(TAG, "Native DDP client unavailable, cannot queue reject for ${payload.callId}")
            return
        }

        val params = buildRejectSignalParams(context, payload) ?: return

        client.queueMethodCall("stream-notify-user", params) { success ->
            Log.d(TAG, "Queued native reject signal result for ${payload.callId}: $success")
            ddpRegistry.stopClient(payload.callId)
        }
        Log.d(TAG, "Queued native reject signal for ${payload.callId}")
    }

    override fun flushPendingQueuedSignalsIfNeeded(callId: String): Boolean {
        val client = ddpRegistry.clientFor(callId) ?: return false
        if (!client.hasQueuedMethodCalls()) {
            return false
        }

        client.flushQueuedMethodCalls()
        return true
    }

    private fun buildAcceptSignalParams(context: Context, payload: VoipPayload): JSONArray? {
        val ids = resolveMediaCallIdentity(context, payload) ?: return null
        return paramsBuilder.buildParams(
            userId = ids.userId,
            callId = payload.callId,
            contractId = ids.deviceId,
            answer = "accept",
            supportedFeatures = listOf(SUPPORTED_VOIP_FEATURES)
        )
    }

    private fun buildRejectSignalParams(context: Context, payload: VoipPayload): JSONArray? {
        val ids = resolveMediaCallIdentity(context, payload) ?: return null
        return paramsBuilder.buildParams(
            userId = ids.userId,
            callId = payload.callId,
            contractId = ids.deviceId,
            answer = "reject",
            supportedFeatures = null
        )
    }

    private fun resolveMediaCallIdentity(context: Context, payload: VoipPayload): VoipMediaCallIdentity? {
        val userId = credentialsProvider.userId()
        if (userId.isNullOrEmpty()) {
            Log.d(TAG, "Missing userId, cannot build stream-notify-user params for ${payload.callId}")
            ddpRegistry.stopClient(payload.callId)
            return null
        }
        val deviceId = credentialsProvider.deviceId()
        if (deviceId.isEmpty()) {
            Log.d(TAG, "Missing deviceId, cannot build stream-notify-user params for ${payload.callId}")
            ddpRegistry.stopClient(payload.callId)
            return null
        }
        return VoipMediaCallIdentity(userId, deviceId)
    }
}
