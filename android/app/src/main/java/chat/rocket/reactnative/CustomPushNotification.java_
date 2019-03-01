package chat.rocket.reactnative;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings.System;
import android.media.RingtoneManager;

import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.PushNotification;

public class CustomPushNotification extends PushNotification {
    public CustomPushNotification(Context context, Bundle bundle, AppLifecycleFacade appLifecycleFacade, AppLaunchHelper appLaunchHelper, JsIOHelper jsIoHelper) {
        super(context, bundle, appLifecycleFacade, appLaunchHelper, jsIoHelper);
    }

    @Override
    protected Notification.Builder getNotificationBuilder(PendingIntent intent) {
        final Resources res = mContext.getResources();
        String packageName = mContext.getPackageName();

        Bundle bundle = mNotificationProps.asBundle();
        int smallIconResId = res.getIdentifier("ic_notification", "mipmap", packageName);
        int largeIconResId = res.getIdentifier("ic_launcher", "mipmap", packageName);
        String title = bundle.getString("title");
        String message = bundle.getString("message");

        String CHANNEL_ID = "rocketchatrn_channel_01";
        String CHANNEL_NAME = "All";

        final Notification.Builder notification = new Notification.Builder(mContext)
            .setSmallIcon(smallIconResId)
            .setContentIntent(intent)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new Notification.BigTextStyle().bigText(message))
            .setPriority(Notification.PRIORITY_HIGH)
            .setDefaults(Notification.DEFAULT_ALL)
            .setAutoCancel(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notification.setColor(mContext.getColor(R.color.notification_text));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                                                                  CHANNEL_NAME,
                                                                  NotificationManager.IMPORTANCE_DEFAULT);

            final NotificationManager notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.createNotificationChannel(channel);

            notification.setChannelId(CHANNEL_ID);
        }

        Bitmap largeIconBitmap = BitmapFactory.decodeResource(res, largeIconResId);
        notification.setLargeIcon(largeIconBitmap);

        return notification;
    }
}
