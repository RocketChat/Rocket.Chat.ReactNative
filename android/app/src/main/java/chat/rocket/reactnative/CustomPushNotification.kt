package chat.rocket.reactnative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings.System
import android.media.RingtoneManager

import com.wix.reactnativenotifications.core.AppLaunchHelper
import com.wix.reactnativenotifications.core.AppLifecycleFacade
import com.wix.reactnativenotifications.core.JsIOHelper
import com.wix.reactnativenotifications.core.notification.PushNotification

const val CHANNEL_ID = "rocketchatrn_channel_01"
const val CHANNEL_NAME = "All"

class CustomPushNotification(
    context: Context,
    bundle: Bundle,
    appLifecycleFacade: AppLifecycleFacade,
    appLaunchHelper: AppLaunchHelper,
    jsIoHelper: JsIOHelper
) : PushNotification(context, bundle, appLifecycleFacade, appLaunchHelper, jsIoHelper) {

    @Override
    protected fun getNotificationBuilder(intent: PendingIntent): Notification.Builder {
        val res = mContext.getResources()
        val packageName = mContext.getPackageName()

        val bundle = mNotificationProps.asBundle()
        val smallIconResId = res.getIdentifier("ic_notification", "mipmap", packageName)
        val largeIconResId = res.getIdentifier("ic_launcher", "mipmap", packageName)
        val title = bundle.getString("title")
        val message = bundle.getString("message")

        val notification = Notification.Builder(mContext)
            .setSmallIcon(smallIconResId)
            .setContentIntent(intent)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(Notification.BigTextStyle().bigText(message))
            .setPriority(Notification.PRIORITY_HIGH)
            .setDefaults(Notification.DEFAULT_ALL)
            .setAutoCancel(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notification.setColor(mContext.getColor(R.color.notification_text))
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            (mContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(
                    NotificationChannel(
                        CHANNEL_ID,
                        CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_DEFAULT
                    )
                )

            notification.setChannelId(CHANNEL_ID)
        }

        notification.setLargeIcon(BitmapFactory.decodeResource(res, largeIconResId))

        return notification
    }
}
