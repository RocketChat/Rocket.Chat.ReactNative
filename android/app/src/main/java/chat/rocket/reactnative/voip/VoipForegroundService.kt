package chat.rocket.reactnative.voip

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import chat.rocket.reactnative.R

/**
 * Foreground service for VoIP calls to ensure reliability on Android 14/15.
 * Prevents the system from killing the call process when the app is in the background.
 */
class VoipForegroundService : Service() {

    companion object {
        private const val TAG = "RocketChat.VoipService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "voip-foreground-service"

        /**
         * Starts the foreground service for an incoming call.
         */
        @JvmStatic
        fun start(context: Context, callUUID: String, callerName: String) {
            val intent = Intent(context, VoipForegroundService::class.java).apply {
                putExtra("callUUID", callUUID)
                putExtra("callerName", callerName)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stops the foreground service.
         */
        @JvmStatic
        fun stop(context: Context) {
            val intent = Intent(context, VoipForegroundService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val callUUID = intent?.getStringExtra("callUUID") ?: return START_NOT_STICKY
        val callerName = intent.getStringExtra("callerName") ?: "Incoming call"

        Log.d(TAG, "Starting foreground service for call: $callUUID")

        // Create notification for foreground service
        val notification = createNotification(callerName)

        // Start foreground service with PHONE_CALL type (Android 14+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Foreground service destroyed")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "VoIP Call Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing VoIP call service"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(callerName: String): Notification {
        val packageName = packageName
        val smallIconResId = resources.getIdentifier("ic_notification", "drawable", packageName)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ongoing call")
            .setContentText("Call with $callerName")
            .setSmallIcon(smallIconResId)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build()
    }
}
