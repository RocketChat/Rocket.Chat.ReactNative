package chat.rocket.reactnative.notification

import android.os.Bundle
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.ExpoFirebaseMessagingService

/**
 * Custom Firebase Messaging Service for Rocket.Chat.
 *
 * Extends ExpoFirebaseMessagingService to integrate with expo-notifications
 * while adding custom notification processing (E2E decryption, MessagingStyle, direct reply, etc.)
 *
 * This ensures:
 * - expo-notifications properly handles FCM token generation (fixes TOO_MANY_REGISTRATION)
 * - CustomPushNotification processes messages for advanced features
 */
class RCFirebaseMessagingService : ExpoFirebaseMessagingService() {

    companion object {
        private const val TAG = "RocketChat.FCM"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "FCM message received from: ${remoteMessage.from}")

        // First, let expo-notifications handle the message (for token/listener management)
        super.onMessageReceived(remoteMessage)

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

        // Process the notification with custom handling
        try {
            val notification = CustomPushNotification(this, bundle)
            notification.onReceived()
        } catch (e: Exception) {
            Log.e(TAG, "Error processing FCM message", e)
        }
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed: ${token.take(10)}...")
        // Let expo-notifications handle token updates
        super.onNewToken(token)
    }

    override fun onDeletedMessages() {
        Log.d(TAG, "FCM messages deleted")
        super.onDeletedMessages()
    }
}
