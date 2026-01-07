package chat.rocket.reactnative.notification

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod

/**
 * Native module to expose push notification Intent data to JavaScript.
 * Used to retrieve pending notification data when the app opens from a notification tap.
 */
class PushNotificationModule(reactContext: ReactApplicationContext) : NativePushNotificationSpec(reactContext) {

    companion object {
        private const val PREFS_NAME = "RocketChatPrefs"
        private const val KEY_PENDING_NOTIFICATION = "pendingNotification"

        /**
         * Stores notification Intent data from a notification tap.
         * Called from MainActivity when receiving a notification Intent.
         */
        @JvmStatic
        fun storePendingNotification(context: Context, notificationJson: String) {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_PENDING_NOTIFICATION, notificationJson)
                .apply()
        }
    }

    /**
     * Gets any pending notification data from a notification tap.
     * Returns null if no pending notification.
     */
    @ReactMethod
    override fun getPendingNotification(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notification = prefs.getString(KEY_PENDING_NOTIFICATION, null)

            // Clear the notification after reading
            notification?.let {
                prefs.edit().remove(KEY_PENDING_NOTIFICATION).apply()
            }

            promise.resolve(notification)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Clears any pending notification data.
     */
    @ReactMethod
    override fun clearPendingNotification() {
        try {
            reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .remove(KEY_PENDING_NOTIFICATION)
                .apply()
        } catch (e: Exception) {
            // Ignore errors
        }
    }
}

