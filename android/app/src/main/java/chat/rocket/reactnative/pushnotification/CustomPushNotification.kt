package chat.rocket.reactnative.pushnotification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import chat.rocket.reactnative.R
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import com.wix.reactnativenotifications.core.AppLaunchHelper
import com.wix.reactnativenotifications.core.AppLifecycleFacade
import com.wix.reactnativenotifications.core.JsIOHelper
import com.wix.reactnativenotifications.core.notification.PushNotification
import kotlinx.serialization.UnstableDefault
import kotlinx.serialization.json.Json
import java.util.*

class CustomPushNotification(
    context: Context,
    bundle: Bundle,
    appLifecycleFacade: AppLifecycleFacade,
    appLaunchHelper: AppLaunchHelper,
    jsIoHelper: JsIOHelper
) : PushNotification(context, bundle, appLifecycleFacade, appLaunchHelper, jsIoHelper) {
    private val smallIcon =
        mContext.resources.getIdentifier("ic_notification", "mipmap", mContext.packageName)
    private lateinit var notificationManager: NotificationManager
    private lateinit var groupBuilder: NotificationCompat.Builder
    private lateinit var title: String
    private lateinit var message: String
    private lateinit var ejson: Ejson
    private lateinit var notificationId: String

    @UnstableDefault
    override fun buildNotification(intent: PendingIntent): Notification {
        with(mNotificationProps.asBundle()) {
            title = getString("title", "")
            message = getString("message", "")
            ejson = Json.nonstrict.parse(Ejson.serializer(), getString("ejson", "{}"))
            notificationId = getString("notId", Random().nextInt().toString())
        }

        notificationManager =
            (mContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)

        groupBuilder = NotificationCompat.Builder(mContext, ejson.host)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(smallIcon)
            .setStyle(NotificationCompat.InboxStyle().setSummaryText(title))
            .setContentIntent(intent)
            .setGroup(ejson.toString())
            .setGroupSummary(true)

        return getNotificationBuilder(intent).build()
    }

    @UnstableDefault
    override fun getNotificationBuilder(intent: PendingIntent): Notification.Builder {
        val notificationBuilder = Notification.Builder(mContext)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(smallIcon)
            .setLargeIcon(
                Glide.with(mContext)
                    .asBitmap()
                    .apply(RequestOptions.circleCropTransform())
                    .load(ejson.avatarUri)
                    .submit(100, 100)
                    .get()
            )
            .setContentIntent(intent)
            .setGroup(ejson.toString())

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notificationBuilder.setColor(mContext.getColor(R.color.notification_text))
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationManager.createNotificationChannel(
                NotificationChannel(ejson.host, ejson.host, NotificationManager.IMPORTANCE_HIGH)
            )
            notificationBuilder.setChannelId(ejson.host)
        }

        return notificationBuilder
    }

    override fun postNotification(id: Int, notification: Notification) {
        with(notificationManager) {
            notify(Random().nextInt(), notification)
            notify(notificationId.toInt(), groupBuilder.build())
        }
    }
}
