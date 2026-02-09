package chat.rocket.reactnative.voip

import android.os.Bundle
import com.google.gson.annotations.SerializedName
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import chat.rocket.reactnative.utils.CallIdUUID
import android.util.Log

data class VoipPayload(
    @SerializedName("callId")
    val callId: String,
    
    @SerializedName("caller")
    val caller: String,
    
    @SerializedName("host")
    val host: String,
    
    @SerializedName("type")
    val type: String
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
            putString("host", host)
            putString("type", type)
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
            putString("host", host)
            putString("type", type)
            putString("callUUID", callUUID)
            putInt("notificationId", notificationId)
        }
    }

    companion object {
        fun fromMap(data: Map<String, String>): VoipPayload? {
            Log.d("RocketChat.VoipPayload", "Parsing VoIP payload from map: $data")
            val type = data["type"] ?: return null
            val callId = data["callId"] ?: return null
            val caller = data["caller"] ?: return null
            val host = data["host"] ?: return null
            if (type != "incoming_call") return null

            return VoipPayload(callId, caller, host, type)
        }

        fun fromBundle(bundle: Bundle?): VoipPayload? {
            if (bundle == null) return null
            val callId = bundle.getString("callId") ?: return null
            val caller = bundle.getString("caller") ?: ""
            val host = bundle.getString("host") ?: ""
            val type = bundle.getString("type") ?: ""

            return VoipPayload(callId, caller, host, type)
        }
    }
}