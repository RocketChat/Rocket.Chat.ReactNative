package chat.rocket.reactnative.notification

import android.os.Bundle
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import chat.rocket.reactnative.BuildConfig
import chat.rocket.reactnative.voip.VoipNotification
import chat.rocket.reactnative.voip.VoipPayload

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
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "FCM message received from: ${remoteMessage.from} data: ${remoteMessage.data}")
        } else {
            Log.d(TAG, "FCM message received from: ${remoteMessage.from}")
        }

        val data = remoteMessage.data
        if (data.isEmpty()) {
            Log.w(TAG, "FCM message has no data payload, ignoring")
            return
        }

        val voipPayload = VoipPayload.fromMap(data)
        if (voipPayload != null) {
            Log.d(TAG, "Detected VoIP payload of type ${voipPayload.type}, routing to VoipNotification handler")
            VoipNotification(this).onMessageReceived(voipPayload)
            return
        }

        // Process regular notifications via CustomPushNotification
        try {
            val bundle = Bundle().apply {
                data.forEach { (key, value) ->
                    putString(key, value)
                }
            }
            val notification = CustomPushNotification(this, bundle)
            notification.onReceived()
        } catch (e: Exception) {
            Log.e(TAG, "Error processing FCM message", e)
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed")
        // Token handling is done by expo-notifications JS layer
        // which uses getDevicePushTokenAsync()
        super.onNewToken(token)
    }
}
