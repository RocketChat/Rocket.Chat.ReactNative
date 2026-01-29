package chat.rocket.reactnative.notification

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.google.gson.GsonBuilder

/**
 * Handles notification Intent processing from MainActivity.
 * Extracts notification data from Intents and stores it for React Native to process.
 */
class NotificationIntentHandler {

    companion object {
        private const val TAG = "RocketChat.NotificationIntentHandler"

        /**
         * Handles a notification Intent from MainActivity.
         * Processes both video conf and regular notification intents.
         */
        @JvmStatic
        fun handleIntent(context: Context, intent: Intent) {
            // Handle video conf action first
            if (handleVideoConfIntent(context, intent)) {
                return
            }

            // Handle regular notification tap
            handleNotificationIntent(context, intent)
        }

        /**
         * Handles video conference notification Intent.
         * @return true if this was a video conf intent, false otherwise
         */
        @JvmStatic
        private fun handleVideoConfIntent(context: Context, intent: Intent): Boolean {
            if (!intent.getBooleanExtra("videoConfAction", false)) {
                return false
            }

            val notificationId = intent.getIntExtra("notificationId", 0)
            val event = intent.getStringExtra("event") ?: return true

            val rid = intent.getStringExtra("rid") ?: ""
            val callerId = intent.getStringExtra("callerId") ?: ""
            val callerName = intent.getStringExtra("callerName") ?: ""
            val host = intent.getStringExtra("host") ?: ""
            val callId = intent.getStringExtra("callId") ?: ""

            // Cancel the notification
            if (notificationId != 0) {
                VideoConfNotification.cancelById(context, notificationId)
            }

            // Store action for JS to pick up - include all required fields
            val data = mapOf(
                "notificationType" to "videoconf",
                "rid" to rid,
                "event" to event,
                "host" to host,
                "callId" to callId,
                "caller" to mapOf(
                    "_id" to callerId,
                    "name" to callerName
                )
            )

            val gson = GsonBuilder().create()
            val jsonData = gson.toJson(data)

            VideoConfModule.storePendingAction(context, jsonData)

            // Clear the video conf flag to prevent re-processing
            intent.removeExtra("videoConfAction")

            return true
        }

        /**
         * Handles regular notification tap (non-video conf).
         * Extracts Intent extras and stores them for React Native to pick up.
         */
        @JvmStatic
        private fun handleNotificationIntent(context: Context, intent: Intent) {
            val extras = intent.extras ?: return

            // Check if this Intent has notification data (ejson)
            val ejson = extras.getString("ejson")
            if (ejson.isNullOrEmpty()) {
                return
            }

            try {
                // Clear the notification from the notification shade
                val notId = extras.getString("notId")
                
                // Clear the notification messages from the static map to prevent stacking
                if (!notId.isNullOrEmpty()) {
                    try {
                        val notIdInt = notId.toIntOrNull()
                        if (notIdInt != null) {
                            CustomPushNotification.clearMessages(notIdInt)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error clearing notification messages for ID $notId: ${e.message}", e)
                    }
                }

                // Extract all notification data from Intent extras
                // Only include serializable types to avoid JSON serialization errors
                val notificationData = mutableMapOf<String, Any?>()

                // Copy all extras to the notification data map, filtering out non-serializable types
                extras.keySet().forEach { key ->
                    try {
                        when (val value = extras.get(key)) {
                            is String -> notificationData[key] = value
                            is Int -> notificationData[key] = value
                            is Boolean -> notificationData[key] = value
                            is Long -> notificationData[key] = value
                            is Float -> notificationData[key] = value
                            is Double -> notificationData[key] = value
                            is Byte -> notificationData[key] = value
                            is Char -> notificationData[key] = value
                            is Short -> notificationData[key] = value
                            // Skip complex types that can't be serialized (Bundle, Parcelable, etc.)
                            is Bundle -> {
                                // Skip Bundle objects - they're not JSON serializable
                                Log.w(TAG, "Skipping Bundle extra: $key")
                            }
                            null -> {
                                // Skip null values
                            }
                            else -> {
                                // For other types, try to convert to String only if it's a simple type
                                // Skip complex objects that might not serialize properly
                                val stringValue = value.toString()
                                // Only include if it's a reasonable string representation (not object reference)
                                if (!stringValue.startsWith("android.") && !stringValue.contains("@")) {
                                    notificationData[key] = stringValue
                                } else {
                                    Log.w(TAG, "Skipping non-serializable extra: $key (type: ${value.javaClass.simpleName})")
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Error processing extra $key: ${e.message}")
                    }
                }

                // Convert to JSON and store for React Native
                val gson = GsonBuilder().create()
                val jsonData = gson.toJson(notificationData)

                // Store notification data with error handling
                try {
                    PushNotificationModule.storePendingNotification(context, jsonData)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to store pending notification: ${e.message}", e)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error handling notification intent: ${e.message}", e)
            }
        }
    }
}

