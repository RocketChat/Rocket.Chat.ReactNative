package chat.rocket.reactnative.conference

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.R

class ConferenceCallService : Service() {

    companion object {
        private const val TAG = "RocketChat.ConferenceCallService"
        private const val CHANNEL_ID = "conference-call-service"
        private const val NOTIFICATION_ID = 2

        private const val ACTION_START = "chat.rocket.reactnative.conference.START_SERVICE"
        const val ACTION_TOGGLE_MIC = "chat.rocket.reactnative.conference.TOGGLE_MIC"
        const val ACTION_LEAVE = "chat.rocket.reactnative.conference.LEAVE"

        private const val NOTIFICATION_ACTION_EVENT = "ConferenceNotificationAction"
        private const val EVENT_TOGGLE_MIC = "toggleMic"
        private const val EVENT_LEAVE = "leave"

        const val EXTRA_OPEN_CALL = "chat.rocket.reactnative.conference.OPEN_CALL"

        private data class Controls(
            val micEnabled: Boolean,
            val muteLabel: String,
            val unmuteLabel: String,
            val leaveLabel: String
        )

        @Volatile
        private var controls: Controls? = null

        @Volatile
        private var running = false

        @JvmStatic
        fun hasMicrophonePermission(context: Context): Boolean =
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

        @JvmStatic
        fun startService(context: Context) {
            val intent = Intent(context, ConferenceCallService::class.java).apply { action = ACTION_START }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        @JvmStatic
        fun stopService(context: Context) {
            ConferenceCallOpenRequest.clear()
            controls = null
            context.stopService(Intent(context, ConferenceCallService::class.java))
        }

        @JvmStatic
        fun updateControls(context: Context, micEnabled: Boolean, muteLabel: String, unmuteLabel: String, leaveLabel: String) {
            val next = Controls(micEnabled, muteLabel, unmuteLabel, leaveLabel)
            if (controls == next) {
                return
            }
            controls = next
            if (running) {
                context.getSystemService(NotificationManager::class.java)?.notify(NOTIFICATION_ID, buildNotification(context))
            }
        }

        internal fun buildNotification(context: Context): Notification {
            val pendingIntent = PendingIntent.getActivity(
                context,
                NOTIFICATION_ID,
                Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                    putExtra(EXTRA_OPEN_CALL, true)
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(context.getString(R.string.conference_call_service_title))
                .setContentText(context.getString(R.string.conference_call_service_text))
                .setSmallIcon(context.applicationInfo.icon)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

            controls?.let {
                // Unmuting needs an unlocked device so nobody can open the microphone from the lock screen.
                val toggleMic = NotificationCompat.Action.Builder(
                    0,
                    if (it.micEnabled) it.muteLabel else it.unmuteLabel,
                    actionIntent(context, ACTION_TOGGLE_MIC)
                ).setAuthenticationRequired(!it.micEnabled).build()
                val leave = NotificationCompat.Action.Builder(0, it.leaveLabel, actionIntent(context, ACTION_LEAVE)).build()
                builder.addAction(toggleMic).addAction(leave)
            }
            return builder.build()
        }

        private fun actionIntent(context: Context, action: String): PendingIntent =
            PendingIntent.getService(
                context,
                NOTIFICATION_ID,
                Intent(context, ConferenceCallService::class.java).apply { this.action = action },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
    }

    override fun onCreate() {
        super.onCreate()
        running = true
        createNotificationChannel()
    }

    override fun onDestroy() {
        running = false
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> if (!startForegroundSafely()) {
                stopSelf(startId)
            }
            ACTION_TOGGLE_MIC -> ConferenceEvents.emit(this, NOTIFICATION_ACTION_EVENT, EVENT_TOGGLE_MIC)
            ACTION_LEAVE -> if (!ConferenceEvents.emit(this, NOTIFICATION_ACTION_EVENT, EVENT_LEAVE)) {
                ConferenceCallService.stopService(this)
            }
            else -> {
                startForegroundSafely()
                stopSelf(startId)
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundSafely(): Boolean {
        return try {
            val notification = buildNotification(this)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, foregroundServiceType())
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed", e)
            false
        }
    }

    private fun foregroundServiceType(): Int {
        var type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
        if (hasMicrophonePermission(this)) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            type = type or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        }
        return type
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.conference_call_service_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.conference_call_service_channel_description)
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
