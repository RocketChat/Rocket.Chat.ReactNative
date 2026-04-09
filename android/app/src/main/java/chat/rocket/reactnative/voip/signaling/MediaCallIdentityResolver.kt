package chat.rocket.reactnative.voip.signaling

import android.content.Context
import chat.rocket.reactnative.voip.VoipPayload

interface MediaCallIdentityResolver {
    fun resolveIdentity(context: Context, payload: VoipPayload): VoipMediaCallIdentity?
}