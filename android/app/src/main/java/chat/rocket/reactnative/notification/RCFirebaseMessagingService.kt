package chat.rocket.reactnative.notification

import android.os.Bundle
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.google.gson.Gson

/**
 * Custom Firebase Messaging Service for Rocket.Chat.
 *
 * Handles incoming FCM messages and routes them to the appropriate handler:
 * - VoipNotification for VoIP calls (notificationType: "voip")
 * - CustomPushNotification for regular messages and video conferences
 */
class RCFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "RocketChat.FCM"
        private val gson = Gson()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "FCM message received from: ${remoteMessage.from}")

        val data = remoteMessage.data
        if (data.isEmpty()) {
            Log.w(TAG, "FCM message has no data payload, ignoring")
            return
        }

        // Convert FCM data to Bundle for processing
        val bundle = Bundle().apply {
            data.forEach { (key, value) ->
                putString(key, value)
            }
        }

        val voipPayload = parseVoipPayload(data)
        if (voipPayload != null && voipPayload.isVoipIncomingCall()) {
            Log.d(TAG, "Detected new VoIP payload format, routing to VoipNotification handler")
            try {
                val ejson = voipPayload.toEjson()
                val voipNotification = VoipNotification(this)
                voipNotification.showIncomingCall(bundle, ejson)
            } catch (e: Exception) {
                Log.e(TAG, "Error processing VoIP notification", e)
            }
            return
        }

        // Process regular notifications via CustomPushNotification
        try {
            val notification = CustomPushNotification(this, bundle)
            notification.onReceived()
        } catch (e: Exception) {
            Log.e(TAG, "Error processing FCM message", e)
        }
    }

    /**
     * Parses the new VoIP payload format from FCM data map.
     * Returns null if the payload doesn't match the new format.
     */
    private fun parseVoipPayload(data: Map<String, String>): VoipPayload? {
        val type = data["type"]
        val hasEjson = data.containsKey("ejson") && !data["ejson"].isNullOrEmpty()
        
        if (type != "incoming_call" || hasEjson) {
            return null
        }

        return try {
            VoipPayload(
                callId = data["callId"],
                calleeId = data["calleeId"],
                caller = data["caller"],
                host = data["host"],
                type = data["type"]
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse VoIP payload", e)
            null
        }
    }

    /**
     * Safely parses ejson string to Ejson object.
     */
    private fun parseEjson(ejsonStr: String?): Ejson? {
        if (ejsonStr.isNullOrEmpty() || ejsonStr == "{}") {
            return null
        }

        return try {
            gson.fromJson(ejsonStr, Ejson::class.java)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse ejson", e)
            null
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed")
        // Token handling is done by expo-notifications JS layer
        // which uses getDevicePushTokenAsync()
        super.onNewToken(token)
    }
}
