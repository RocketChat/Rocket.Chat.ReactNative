package chat.rocket.reactnative.notification

import android.os.Bundle
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Custom Firebase Messaging Service for Rocket.Chat.
 *
 * Handles incoming FCM messages and routes them to CustomPushNotification
 * for advanced processing (E2E decryption, MessagingStyle, direct reply, etc.)
 */
class RCFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "RocketChat.FCM"
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

        // Process the notification
        try {
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
