package chat.rocket.reactnative.notification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.NotificationCompat
import chat.rocket.reactnative.MainActivity

/**
 * Handles VoIP call notifications using Android's Telecom framework via CallKeep.
 * Displays incoming call UI through the system's phone app / telecom service.
 *
 * When CallKeep is available (app running), it uses the native telecom call UI.
 * When CallKeep is not available (app killed), it shows a high-priority notification
 * similar to VideoConfNotification.
 */
class VoipNotification(private val context: Context) {

    companion object {
        private const val TAG = "RocketChat.VoIP"

        const val CHANNEL_ID = "voip-call"
        const val CHANNEL_NAME = "VoIP Calls"

        const val ACTION_ACCEPT = "chat.rocket.reactnative.ACTION_VOIP_ACCEPT"
        const val ACTION_DECLINE = "chat.rocket.reactnative.ACTION_VOIP_DECLINE"


        /**
         * Static method to retrieve stored call data from any context.
         */
        @JvmStatic
        fun getStoredCallData(context: Context): Bundle? {
            try {
                val prefs = context.getSharedPreferences("VoipCallData", Context.MODE_PRIVATE)
                val callId = prefs.getString("callId", null) ?: return null
                val callUUID = prefs.getString("callUUID", null) ?: return null

                // Check if data is stale (older than 5 minutes)
                val timestamp = prefs.getLong("timestamp", 0)
                if (System.currentTimeMillis() - timestamp > 5 * 60 * 1000) {
                    Log.d(TAG, "Stored VoIP call data is stale, clearing")
                    clearStoredCallData(context)
                    return null
                }

                return Bundle().apply {
                    putString("notificationType", "voip")
                    putString("callId", callId)
                    putString("callUUID", callUUID)
                    putString("callerName", prefs.getString("callerName", "Unknown"))
                    putString("host", prefs.getString("host", ""))
                    putString("ejson", prefs.getString("ejson", "{}"))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to retrieve stored VoIP call data", e)
                return null
            }
        }

        /**
         * Static method to clear stored call data from any context.
         */
        @JvmStatic
        fun clearStoredCallData(context: Context) {
            try {
                val prefs = context.getSharedPreferences("VoipCallData", Context.MODE_PRIVATE)
                prefs.edit().clear().apply()
                Log.d(TAG, "Cleared stored VoIP call data")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to clear stored VoIP call data", e)
            }
        }

        /**
         * Cancels a VoIP notification by ID.
         */
        @JvmStatic
        fun cancelById(context: Context, notificationId: Int) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.cancel(notificationId)
            Log.d(TAG, "VoIP notification cancelled with ID: $notificationId")
        }
    }

    private val notificationManager: NotificationManager? =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    init {
        createNotificationChannel()
    }

    /**
     * Creates the notification channel for VoIP calls with high importance and ringtone sound.
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming VoIP calls"
                enableLights(true)
                enableVibration(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC

                // Set ringtone sound
                val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build()
                setSound(ringtoneUri, audioAttributes)
            }

            notificationManager?.createNotificationChannel(channel)
        }
    }

    /**
     * Displays an incoming VoIP call using CallKeep's telecom integration.
     * Falls back to a notification if CallKeep is not available.
     *
     * @param bundle The notification data bundle
     * @param ejson The parsed notification payload
     */
    fun showIncomingCall(bundle: Bundle, ejson: Ejson) {
        val callId = ejson.callId
        if (callId.isNullOrEmpty()) {
            Log.w(TAG, "Cannot show VoIP call: callId is missing")
            return
        }

        // Get caller information
        val callerName: String = when {
            !ejson.senderName.isNullOrEmpty() -> ejson.senderName
            ejson.caller?.name != null -> ejson.caller.name
            ejson.caller?.username != null -> ejson.caller.username
            ejson.sender?.name != null -> ejson.sender.name
            ejson.sender?.username != null -> ejson.sender.username
            else -> "Unknown"
        }

        // Generate deterministic UUID from callId (matching iOS implementation)
        val callUUID = CallIdUUID.generateUUIDv5(callId)

        Log.d(TAG, "Showing incoming VoIP call - callId: $callId, callUUID: $callUUID, caller: $callerName")

        // Store call data for when the user answers
        storeCallData(callId, callUUID, callerName, ejson.host, bundle.getString("ejson", "{}"))

        // Fallback to showing a high-priority notification
        showFallbackNotification(bundle, ejson, callUUID, callerName)
    }

    /**
     * Stores call data in SharedPreferences for retrieval when the call is answered.
     * This is needed because CallKeep's answer callback only provides the UUID,
     * not the full call data.
     */
    private fun storeCallData(callId: String, callUUID: String, callerName: String, host: String?, ejsonStr: String) {
        try {
            val prefs = context.getSharedPreferences("VoipCallData", Context.MODE_PRIVATE)
            prefs.edit().apply {
                putString("callId", callId)
                putString("callUUID", callUUID)
                putString("callerName", callerName)
                putString("host", host ?: "")
                putString("ejson", ejsonStr)
                putLong("timestamp", System.currentTimeMillis())
                apply()
            }
            Log.d(TAG, "Stored VoIP call data for callUUID: $callUUID")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to store VoIP call data", e)
        }
    }

    /**
     * Fallback notification when CallKeep is not available (app killed).
     * Shows a high-priority notification similar to VideoConfNotification.
     */
    private fun showFallbackNotification(bundle: Bundle, ejson: Ejson, callUUID: String, callerName: String) {
        val callId = ejson.callId ?: ""

        // Generate notification ID from callUUID
        val notificationId = callUUID.replace("-", "").hashCode()

        Log.d(TAG, "Showing fallback notification for VoIP call from: $callerName")

        // Create intent data for actions
        val intentData = Bundle().apply {
            putString("notificationType", "voip")
            putString("callId", callId)
            putString("callUUID", callUUID)
            putString("callerName", callerName)
            putString("host", ejson.host ?: "")
            putString("ejson", bundle.getString("ejson", "{}"))
            putInt("notificationId", notificationId)
        }

        // Full screen intent - opens app when notification is tapped
        val fullScreenIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intentData)
            putExtra("event", "default")
        }
        val fullScreenPendingIntent = createPendingIntent(notificationId, fullScreenIntent)

        // Accept action
        val acceptIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intentData)
            putExtra("event", "accept")
            putExtra("voipAction", true)
            action = "${ACTION_ACCEPT}_$notificationId"
        }
        val acceptPendingIntent = createPendingIntent(notificationId + 1, acceptIntent)

        // Decline action
        val declineIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intentData)
            putExtra("event", "decline")
            putExtra("voipAction", true)
            action = "${ACTION_DECLINE}_$notificationId"
        }
        val declinePendingIntent = createPendingIntent(notificationId + 2, declineIntent)

        // Get icons
        val packageName = context.packageName
        val smallIconResId = context.resources.getIdentifier("ic_notification", "drawable", packageName)

        // Fetch caller avatar
        val avatarUri = ejson.getCallerAvatarUri()
        val avatarBitmap: Bitmap? = if (avatarUri != null) {
            NotificationHelper.fetchAvatarBitmap(context, avatarUri, null)
        } else {
            null
        }

        // Build notification
        val builder = NotificationCompat.Builder(context, CHANNEL_ID).apply {
            setSmallIcon(smallIconResId)
            setContentTitle("Incoming call")
            setContentText("Call from $callerName")
            priority = NotificationCompat.PRIORITY_HIGH
            setCategory(NotificationCompat.CATEGORY_CALL)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setAutoCancel(false)
            setOngoing(true)
            setFullScreenIntent(fullScreenPendingIntent, true)
            setContentIntent(fullScreenPendingIntent)
            addAction(0, "Decline", declinePendingIntent)
            addAction(0, "Accept", acceptPendingIntent)

            if (avatarBitmap != null) {
                setLargeIcon(avatarBitmap)
            }
        }

        // Set sound for pre-O devices
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            builder.setSound(ringtoneUri)
        }

        // Show notification
        notificationManager?.notify(notificationId, builder.build())
        Log.d(TAG, "VoIP fallback notification displayed with ID: $notificationId")
    }

    /**
     * Creates a PendingIntent with appropriate flags for the Android version.
     */
    private fun createPendingIntent(requestCode: Int, intent: Intent): PendingIntent {
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getActivity(context, requestCode, intent, flags)
    }

    /**
     * Cancels a VoIP call by callId.
     *
     * @param callId The call ID
     */
    fun cancelCall(callId: String) {
        val callUUID = CallIdUUID.generateUUIDv5(callId)

        // Cancel fallback notification if shown
        val notificationId = callUUID.replace("-", "").hashCode()
        cancelById(context, notificationId)

        // Clear stored data
        clearStoredCallData(context)
    }
}
