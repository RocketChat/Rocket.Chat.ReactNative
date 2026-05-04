package chat.rocket.reactnative.voip

import android.app.Notification
import android.app.NotificationChannel
import chat.rocket.reactnative.BuildConfig
import chat.rocket.reactnative.R
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import chat.rocket.reactnative.MainActivity

/**
 * Foreground service that keeps the VoIP call alive when the app moves to the background.
 * Required because Android terminates background processes without a foreground service,
 * which would drop the active audio session.
 *
 * Started on call accept, stopped on hangup.
 */
class VoipCallService : Service() {

    companion object {
        private const val TAG = "RocketChat.VoipCallService"
        private const val CHANNEL_ID = "voip-call-service"
        private const val CHANNEL_NAME = "VoIP Call"
        private const val NOTIFICATION_ID = 1

        private const val ACTION_START = "chat.rocket.reactnative.voip.START_SERVICE"
        private const val ACTION_STOP = "chat.rocket.reactnative.voip.STOP_SERVICE"
        const val EXTRA_CALL_ID = "callId"

        private var isRunning = false

        @JvmStatic
        fun startService(context: android.content.Context, callId: String) {
            val intent = Intent(context, VoipCallService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_CALL_ID, callId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        @JvmStatic
        fun stopService(context: android.content.Context) {
            val intent = Intent(context, VoipCallService::class.java).apply {
                action = ACTION_STOP
            }
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "VoipCallService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Enter foreground state unconditionally before branching on action.
        // The OS five-second rule fires ForegroundServiceDidNotStartInTimeException if startForeground
        // is never called — including on sticky restarts and unexpected intent redelivery where the
        // action may be null or unrecognised.  Calling startForeground here then immediately calling
        // stopSelf is safe: the system will promote the service to foreground and then tear it down
        // gracefully, which avoids the ANR-style crash.
        val callId = intent?.getStringExtra(EXTRA_CALL_ID) ?: "unknown"
        startForegroundWithNotification(callId)

        when (intent?.action) {
            ACTION_STOP -> {
                isRunning = false
                Log.d(TAG, "Stopping VoipCallService")
                stopSelf(startId)
                return START_NOT_STICKY
            }
            ACTION_START -> {
                if (BuildConfig.DEBUG) {
                    Log.d(TAG, "Starting VoipCallService for callId: $callId")
                }
                isRunning = true
                return START_NOT_STICKY
            }
            else -> {
                Log.w(TAG, "Unknown action: ${intent?.action} — entered foreground then stopping")
                stopSelf(startId)
                return START_NOT_STICKY
            }
        }
    }

    private fun startForegroundWithNotification(callId: String) {
        val notification = buildNotification(callId)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        if (BuildConfig.DEBUG) {
            Log.d(TAG, "Started foreground with notification for callId: $callId")
        }
    }

    private fun buildNotification(callId: String): Notification {
        // Pending intent: tapping the notification opens the app.
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE
            } else {
                0
            }
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.voip_call_service_title))
            .setContentText(getString(R.string.voip_call_service_text))
            .setSmallIcon(getApplicationInfo().icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.voip_call_service_channel_description)
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        Log.d(TAG, "VoipCallService destroyed")
        super.onDestroy()
    }
}