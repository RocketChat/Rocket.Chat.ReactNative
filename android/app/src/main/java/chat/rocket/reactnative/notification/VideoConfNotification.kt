package chat.rocket.reactnative.notification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.NotificationCompat
import chat.rocket.reactnative.MainActivity

/**
 * Handles video conference call notifications with call-style UI.
 * Displays incoming call notifications with Accept/Decline actions.
 */
class VideoConfNotification(private val context: Context) {

    companion object {
        private const val TAG = "RocketChat.VideoConf"

        const val CHANNEL_ID = "video-conf-call"
        const val CHANNEL_NAME = "Video Calls"

        const val ACTION_ACCEPT = "chat.rocket.reactnative.ACTION_VIDEO_CONF_ACCEPT"
        const val ACTION_DECLINE = "chat.rocket.reactnative.ACTION_VIDEO_CONF_DECLINE"
        const val EXTRA_NOTIFICATION_DATA = "notification_data"

        /**
         * Cancels a video call notification by notification ID.
         */
        @JvmStatic
        fun cancelById(context: Context, notificationId: Int) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.cancel(notificationId)
            Log.d(TAG, "Video call notification cancelled with ID: $notificationId")
        }
    }

    private val notificationManager: NotificationManager? =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    init {
        createNotificationChannel()
    }

    /**
     * Creates the notification channel for video calls with high importance and ringtone sound.
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming video conference calls"
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
     * Displays an incoming video call notification.
     *
     * @param bundle The notification data bundle
     * @param ejson The parsed notification payload
     */
    fun showIncomingCall(bundle: Bundle, ejson: Ejson) {
        val rid = ejson.rid
        // Video conf uses 'caller' field, regular messages use 'sender'
        val callerId: String
        val callerName: String

        if (ejson.caller != null) {
            callerId = ejson.caller._id ?: ""
            callerName = ejson.caller.name ?: "Unknown"
        } else if (ejson.sender != null) {
            // Fallback to sender if caller is not present
            callerId = ejson.sender._id ?: ""
            callerName = ejson.sender.name ?: ejson.senderName ?: "Unknown"
        } else {
            callerId = ""
            callerName = "Unknown"
        }

        // Generate unique notification ID from rid + callerId
        val notificationIdStr = (rid + callerId).replace(Regex("[^A-Za-z0-9]"), "")
        val notificationId = notificationIdStr.hashCode()

        Log.d(TAG, "Showing incoming call notification from: $callerName")

        // Create intent data for actions - include all required fields for JS
        val intentData = Bundle().apply {
            putString("rid", rid ?: "")
            putString("notificationType", "videoconf")
            putString("callerId", callerId)
            putString("callerName", callerName)
            putString("host", ejson.host ?: "")
            putString("callId", ejson.callId ?: "")
            putString("ejson", bundle.getString("ejson", "{}"))
            putInt("notificationId", notificationId)
        }

        Log.d(TAG, "Intent data - rid: $rid, callerId: $callerId, host: ${ejson.host}, callId: ${ejson.callId}")

        // Full screen intent - opens app when notification is tapped
        val fullScreenIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intentData)
            putExtra("event", "default")
        }

        val fullScreenPendingIntent = createPendingIntent(notificationId, fullScreenIntent)

        // Accept action - directly opens MainActivity (Android 12+ blocks trampoline pattern)
        val acceptIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intentData)
            putExtra("event", "accept")
            putExtra("videoConfAction", true)
            action = "${ACTION_ACCEPT}_$notificationId" // Unique action to differentiate intents
        }

        val acceptPendingIntent = createPendingIntent(notificationId + 1, acceptIntent)

        // Decline action - directly opens MainActivity
        val declineIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intentData)
            putExtra("event", "decline")
            putExtra("videoConfAction", true)
            action = "${ACTION_DECLINE}_$notificationId" // Unique action to differentiate intents
        }

        val declinePendingIntent = createPendingIntent(notificationId + 2, declineIntent)

        // Get icons
        val packageName = context.packageName
        val smallIconResId = context.resources.getIdentifier("ic_notification", "drawable", packageName)

        // Fetch caller avatar
        val avatarUri = ejson.getCallerAvatarUri()
        val avatarBitmap = if (avatarUri != null) {
            getAvatar(avatarUri)
        } else {
            null
        }

        // Build notification
        val builder = NotificationCompat.Builder(context, CHANNEL_ID).apply {
            setSmallIcon(smallIconResId)
            setContentTitle("Incoming call")
            setContentText("Video call from $callerName")
            priority = NotificationCompat.PRIORITY_HIGH
            setCategory(NotificationCompat.CATEGORY_CALL)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setAutoCancel(false)
            setOngoing(true)
            setFullScreenIntent(fullScreenPendingIntent, true)
            setContentIntent(fullScreenPendingIntent)
            addAction(0, "Decline", declinePendingIntent)
            addAction(0, "Accept", acceptPendingIntent)
            
            // Set large icon (avatar) if available
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
        Log.d(TAG, "Video call notification displayed with ID: $notificationId")
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
     * Fetches avatar bitmap from URI using Glide.
     * Returns null if fetch fails or times out, in which case notification will display without avatar.
     */
    private fun getAvatar(uri: String): Bitmap? {
        return NotificationHelper.fetchAvatarBitmap(context, uri, null)
    }

    /**
     * Cancels a video call notification.
     *
     * @param rid The room ID
     * @param callerId The caller's user ID
     */
    fun cancelCall(rid: String, callerId: String) {
        val notificationIdStr = (rid + callerId).replace(Regex("[^A-Za-z0-9]"), "")
        val notificationId = notificationIdStr.hashCode()

        notificationManager?.cancel(notificationId)
        Log.d(TAG, "Video call notification cancelled with ID: $notificationId")
    }
}
