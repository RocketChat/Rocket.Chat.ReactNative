package chat.rocket.reactnative.voip

import android.os.Bundle
import com.google.gson.annotations.SerializedName
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import chat.rocket.reactnative.utils.CallIdUUID

data class VoipPayload(
    @SerializedName("callId")
    val callId: String,
    
    @SerializedName("caller")
    val caller: String,

    @SerializedName("username")
    val username: String,
    
    @SerializedName("host")
    val host: String,
    
    @SerializedName("type")
    val type: String,
    
    @SerializedName("hostName")
    val hostName: String,
) {
    val notificationId: Int = callId.hashCode()
    val callUUID: String = CallIdUUID.generateUUIDv5(callId)

    fun isVoipIncomingCall(): Boolean {
        return type == "incoming_call" && callId.isNotEmpty() && caller.isNotEmpty() && host.isNotEmpty()
    }

    fun toBundle(): Bundle {
        return Bundle().apply {
            putString("callId", callId)
            putString("caller", caller)
            putString("username", username)
            putString("host", host)
            putString("type", type)
            putString("hostName", hostName)
            putString("callUUID", callUUID)
            putInt("notificationId", notificationId)
            // Useful flag for MainActivity to know it's handling a VoIP action
            putBoolean("voipAction", true)
        }
    }

    fun toWritableMap(): WritableMap {
        return Arguments.createMap().apply {
            putString("callId", callId)
            putString("caller", caller)
            putString("username", username)
            putString("host", host)
            putString("type", type)
            putString("hostName", hostName)
            putString("callUUID", callUUID)
            putInt("notificationId", notificationId)
        }
    }

    companion object {
        fun fromMap(data: Map<String, String>): VoipPayload? {
            val type = data["type"] ?: return null
            val callId = data["callId"] ?: return null
            val caller = data["caller"] ?: return null
            val username = data["username"] ?: return null
            val host = data["host"] ?: return null
            val hostName = data["hostName"] ?: return null
            if (type != "incoming_call") return null

            return VoipPayload(callId, caller, username, host, type, hostName)
        }

        fun fromBundle(bundle: Bundle?): VoipPayload? {
            if (bundle == null) return null
            val callId = bundle.getString("callId") ?: return null
            val caller = bundle.getString("caller") ?: return null
            val username = bundle.getString("username") ?: return null
            val host = bundle.getString("host") ?: return null
            val type = bundle.getString("type") ?: return null
            val hostName = bundle.getString("hostName") ?: return null

            return VoipPayload(callId, caller, username, host, type, hostName)
        }
    }
}