package chat.rocket.reactnative.upload

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.facebook.react.ReactApplication

class UploadForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_CANCEL) {
            (application as? ReactApplication)?.reactHost?.currentReactContext?.emitDeviceEvent(EVENT_CANCEL)
            if (!running) stopSelf()
            return START_NOT_STICKY
        }
        title = intent?.getStringExtra(EXTRA_TITLE).orEmpty()
        cancelLabel = intent?.getStringExtra(EXTRA_CANCEL_LABEL).orEmpty()
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC else 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(NotificationChannel(CHANNEL_ID, title, NotificationManager.IMPORTANCE_LOW))
        }
        val percent = intent?.getIntExtra(EXTRA_PERCENT, -1) ?: -1
        ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(this, percent.takeIf { it >= 0 }), type)
        running = true
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        running = false
        super.onDestroy()
    }

    override fun onTimeout(startId: Int, fgsType: Int) {
        stopSelf()
    }

    companion object {
        private const val CHANNEL_ID = "file-upload"
        private const val NOTIFICATION_ID = 7421
        private const val EXTRA_TITLE = "title"
        private const val EXTRA_CANCEL_LABEL = "cancelLabel"
        private const val EXTRA_PERCENT = "percent"
        private const val ACTION_CANCEL = "chat.rocket.reactnative.ACTION_CANCEL_UPLOAD"
        private const val EVENT_CANCEL = "UploadServiceCancel"

        @Volatile private var running = false
        @Volatile private var title = ""
        @Volatile private var cancelLabel = ""

        fun intent(context: Context, title: String? = null, cancelLabel: String? = null, percent: Int = -1): Intent =
            Intent(context, UploadForegroundService::class.java)
                .putExtra(EXTRA_TITLE, title)
                .putExtra(EXTRA_CANCEL_LABEL, cancelLabel)
                .putExtra(EXTRA_PERCENT, percent)

        fun updateProgress(context: Context, percent: Int) {
            if (!running) return
            context.getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(context, percent))
        }

        private fun buildNotification(context: Context, percent: Int?): Notification {
            val cancelIntent = PendingIntent.getService(
                context,
                0,
                Intent(context, UploadForegroundService::class.java).setAction(ACTION_CANCEL),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            return NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setSmallIcon(android.R.drawable.stat_sys_upload)
                .addAction(0, cancelLabel, cancelIntent)
                .setOngoing(true)
                .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
                .setProgress(100, percent ?: 0, percent == null)
                .setContentText(percent?.let { "$it%" })
                .build()
        }
    }
}
