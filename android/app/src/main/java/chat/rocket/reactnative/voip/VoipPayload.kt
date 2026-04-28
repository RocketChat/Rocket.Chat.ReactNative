package chat.rocket.reactnative.voip

import android.os.Bundle
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

enum class VoipPushType(val value: String) {
    INCOMING_CALL("incoming_call");

    companion object {
        fun from(value: String?): VoipPushType? = entries.firstOrNull { it.value == value }
    }
}

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

    val voipAcceptFailed: Boolean = false,
) {
    val notificationId: Int = callId.hashCode()
    val pushType: VoipPushType?
        get() = VoipPushType.from(type)

    private val createdAtMs: Long?
        get() = parseCreatedAtMs(createdAt)

    fun isVoipIncomingCall(): Boolean {
        return pushType == VoipPushType.INCOMING_CALL &&
            callId.isNotBlank() &&
            caller.isNotBlank() &&
            host.isNotBlank()
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
            putBoolean("voipAcceptFailed", voipAcceptFailed)
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
            if (voipAcceptFailed) {
                putBoolean("voipAcceptFailed", true)
            }
        }
    }

    fun getRemainingLifetimeMs(nowMs: Long = System.currentTimeMillis()): Long? {
        val createdAtMs = createdAtMs ?: return null
        val skew = kotlin.math.abs(nowMs - createdAtMs)
        if (skew > MAX_TRUSTED_CLOCK_SKEW_MS) {
            return INCOMING_CALL_LIFETIME_MS
        }
        val expiresAtMs = createdAtMs + INCOMING_CALL_LIFETIME_MS
        return (expiresAtMs - nowMs).coerceAtLeast(0L)
    }

    fun isExpired(nowMs: Long = System.currentTimeMillis()): Boolean {
        val remainingLifetimeMs = getRemainingLifetimeMs(nowMs)
        return remainingLifetimeMs?.let { it <= 0L } ?: true
    }

    companion object {
        private val gson = Gson()
        private const val VOIP_NOTIFICATION_TYPE = "voip"
        // the amount of time in milliseconds that an incoming call will be kept alive
        private const val INCOMING_CALL_LIFETIME_MS = 60_000L
        // Maximum tolerated drift between device clock and server `createdAt` before
        // treating the device clock as untrusted. Within this window we honour the
        // existing expiry math; outside we grant the full incoming-call lifetime.
        private const val MAX_TRUSTED_CLOCK_SKEW_MS = 10 * 60_000L
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
                if (notificationType != VOIP_NOTIFICATION_TYPE) return null

                val payloadType = VoipPushType.from(type)?.value ?: return null
                val payloadCreatedAt = createdAt?.takeUnless { it.isBlank() } ?: return null

                return VoipPayload(
                    callId = callId ?: return null,
                    caller = caller?.name.orEmpty(),
                    username = caller?.username ?: username.orEmpty(),
                    host = host.orEmpty(),
                    type = payloadType,
                    hostName = hostName.orEmpty(),
                    avatarUrl = caller?.avatarUrl,
                    createdAt = payloadCreatedAt,
                    voipAcceptFailed = false,
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
            val caller = bundle.getString("caller").orEmpty()
            val username = bundle.getString("username").orEmpty()
            val host = bundle.getString("host").orEmpty()
            val hostName = bundle.getString("hostName").orEmpty()
            val type = bundle.getString("type") ?: return null
            val avatarUrl = bundle.getString("avatarUrl")
            val createdAt = bundle.getString("createdAt")?.takeUnless { it.isBlank() } ?: return null

            if (VoipPushType.from(type) == null) {
                return null
            }

            val voipAcceptFailed = bundle.getBoolean("voipAcceptFailed", false)
            return VoipPayload(callId, caller, username, host, type, hostName, avatarUrl, createdAt, voipAcceptFailed)
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

            for (formatter in isoDateFormats) {
                val parsed = synchronized(formatter) {
                    runCatching { formatter.parse(value) }.getOrNull()
                }
                if (parsed != null) {
                    return parsed.time
                }
            }

            return null
        }
    }
}