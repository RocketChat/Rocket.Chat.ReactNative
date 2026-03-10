package chat.rocket.reactnative.voip

import android.os.Bundle
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

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

    @SerializedName("avatarUrl")
    val avatarUrl: String?,

    @SerializedName("createdAt")
    val createdAt: String?,
) {
    val notificationId: Int = callId.hashCode()
    private val createdAtMs: Long?
        get() = parseCreatedAtMs(createdAt)

    private val expiresAtMs: Long?
        get() = createdAtMs?.plus(INCOMING_CALL_LIFETIME_MS)

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
            putString("avatarUrl", avatarUrl)
            putString("createdAt", createdAt)
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
            putString("avatarUrl", avatarUrl)
            putString("createdAt", createdAt)
            putInt("notificationId", notificationId)
        }
    }

    fun getRemainingLifetimeMs(): Long? {
        val expiresAtMs = expiresAtMs ?: return null
        val nowMs = System.currentTimeMillis()
        return (expiresAtMs - nowMs).coerceAtLeast(0L)
    }

    fun isExpired(): Boolean {
        val remainingLifetimeMs = getRemainingLifetimeMs() ?: return true
        return remainingLifetimeMs <= 0L
    }

    companion object {
        private val gson = Gson()
        // the amount of time in milliseconds that an incoming call will be kept alive
        private const val INCOMING_CALL_LIFETIME_MS = 60_000L
        private val isoDateFormats = listOf(
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US),
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX", Locale.US),
        ).onEach { formatter ->
            formatter.timeZone = TimeZone.getTimeZone("UTC")
            formatter.isLenient = false
        }

        private data class RemoteCaller(
            @SerializedName("name")
            val name: String? = null,

            @SerializedName("username")
            val username: String? = null,

            @SerializedName("avatarUrl")
            val avatarUrl: String? = null,
        )

        private data class RemoteVoipPayload(
            @SerializedName("callId")
            val callId: String? = null,

            @SerializedName("caller")
            val caller: RemoteCaller? = null,

            @SerializedName("username")
            val username: String? = null,

            @SerializedName("host")
            val host: String? = null,

            @SerializedName("type")
            val type: String? = null,

            @SerializedName("hostName")
            val hostName: String? = null,

            @SerializedName("notificationType")
            val notificationType: String? = null,

            @SerializedName("createdAt")
            val createdAt: String? = null,
        ) {
            fun toVoipPayload(): VoipPayload? {
                if (notificationType != "voip") return null

                val payloadType = type ?: return null
                if (payloadType != "incoming_call") return null

                return VoipPayload(
                    callId = callId ?: return null,
                    caller = caller?.name ?: return null,
                    username = caller?.username ?: username ?: return null,
                    host = host ?: return null,
                    type = payloadType,
                    hostName = hostName ?: return null,
                    avatarUrl = caller?.avatarUrl,
                    createdAt = createdAt,
                )
            }
        }

        fun fromMap(data: Map<String, String>): VoipPayload? {
            val payload = parseRemotePayload(data) ?: return null
            return payload.toVoipPayload()
        }

        fun fromBundle(bundle: Bundle?): VoipPayload? {
            if (bundle == null) return null
            val callId = bundle.getString("callId") ?: return null
            val caller = bundle.getString("caller") ?: return null
            val username = bundle.getString("username") ?: return null
            val host = bundle.getString("host") ?: return null
            val hostName = bundle.getString("hostName") ?: return null
            val type = bundle.getString("type") ?: return null
            val avatarUrl = bundle.getString("avatarUrl")
            val createdAt = bundle.getString("createdAt")

            return VoipPayload(callId, caller, username, host, type, hostName, avatarUrl, createdAt)
        }

        private fun parseRemotePayload(data: Map<String, String>): RemoteVoipPayload? {
            val rawPayload = data["ejson"]
            if (rawPayload.isNullOrBlank() || rawPayload == "{}") {
                return null
            }

            return try {
                gson.fromJson(rawPayload, RemoteVoipPayload::class.java)
            } catch (_: Exception) {
                null
            }
        }

        private fun parseCreatedAtMs(value: String?): Long? {
            if (value.isNullOrBlank()) {
                return null
            }

            isoDateFormats.forEach { formatter ->
                synchronized(formatter) {
                    val parsed = formatter.parse(value)
                    if (parsed != null) {
                        return parsed.time
                    }
                }
            }

            return null
        }
    }
}