package chat.rocket.reactnative.voip

import com.google.gson.annotations.SerializedName

data class VoipPayload(
    @SerializedName("callId")
    val callId: String?,
    
    @SerializedName("caller")
    val caller: String?,
    
    @SerializedName("host")
    val host: String?,
    
    @SerializedName("type")
    val type: String?
) {
    /**
     * Checks if this payload represents a VoIP incoming call.
     */
    fun isVoipIncomingCall(): Boolean {
        return type == "incoming_call" && !callId.isNullOrEmpty()
    }
}
