package chat.rocket.reactnative.pushnotification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import chat.rocket.reactnative.R
import com.wix.reactnativenotifications.core.AppLaunchHelper
import com.wix.reactnativenotifications.core.AppLifecycleFacade
import com.wix.reactnativenotifications.core.JsIOHelper
import com.wix.reactnativenotifications.core.notification.PushNotification
import kotlinx.serialization.UnstableDefault
import kotlinx.serialization.json.Json

class CustomPushNotification(
    context: Context,
    bundle: Bundle,
    appLifecycleFacade: AppLifecycleFacade,
    appLaunchHelper: AppLaunchHelper,
    jsIoHelper: JsIOHelper
) : PushNotification(context, bundle, appLifecycleFacade, appLaunchHelper, jsIoHelper) {

    @UnstableDefault
    override fun getNotificationBuilder(intent: PendingIntent): Notification.Builder {
        val res = mContext.resources
        val packageName = mContext.packageName

        val bundle = mNotificationProps.asBundle()
        val title = bundle.getString("title")
        val message = bundle.getString("message")
        val ejson = Json.nonstrict.parse(
            Ejson.serializer(),
            bundle.getString("ejson", "{}")
        )

        val notificationBuilder = Notification.Builder(mContext)
            .setSmallIcon(res.getIdentifier("ic_notification", "mipmap", packageName))
            .setContentTitle(title)
            .setContentText(message)
            .setGroup(ejson.toString())
            .setGroupSummary(true)
            .setStyle(Notification.BigTextStyle().bigText(message))
            .setContentIntent(intent)
            .setLargeIcon(
                BitmapFactory.decodeResource(
                    res,
                    res.getIdentifier("ic_launcher", "mipmap", packageName)
                )
            )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notificationBuilder.setColor(mContext.getColor(R.color.notification_text))
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            (mContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(
                    NotificationChannel(
                        ejson.rid,
                        ejson.host,
                        NotificationManager.IMPORTANCE_HIGH
                    )
                )

            notificationBuilder.setChannelId(ejson.rid)
        }

        return notificationBuilder
    }
}
