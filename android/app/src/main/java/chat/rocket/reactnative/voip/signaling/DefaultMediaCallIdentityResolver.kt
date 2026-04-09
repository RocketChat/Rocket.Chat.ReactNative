package chat.rocket.reactnative.voip.signaling

import android.content.Context
import chat.rocket.reactnative.voip.VoipPayload
import chat.rocket.reactnative.voip.credentials.VoipCredentialsProvider

class DefaultMediaCallIdentityResolver(
    private val credentialsProvider: VoipCredentialsProvider
) : MediaCallIdentityResolver {

    override fun resolveIdentity(context: Context, payload: VoipPayload): VoipMediaCallIdentity? {
        val userId = credentialsProvider.userId()
        val deviceId = credentialsProvider.deviceId()

        if (userId.isNullOrEmpty() || deviceId.isEmpty()) {
            return null
        }

        return VoipMediaCallIdentity(userId, deviceId)
    }
}