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

import java.util.Random;
import androidx.core.app.NotificationCompat;

import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.PushNotification;

public class CustomPushNotification extends PushNotification {
    public CustomPushNotification(Context context, Bundle bundle, AppLifecycleFacade appLifecycleFacade, AppLaunchHelper appLaunchHelper, JsIOHelper jsIoHelper) {
        super(context, bundle, appLifecycleFacade, appLaunchHelper, jsIoHelper);
    }

    private int smallIconResId = mContext.getResources().getIdentifier("ic_notification", "mipmap", mContext.getPackageName());
    private NotificationManager notificationManager;
    private NotificationCompat.Builder groupBuilder;
    private String notificationId;
    private String title;
    private String message;

    @Override
    protected Notification buildNotification(PendingIntent intent) {
        Bundle bundle = mNotificationProps.asBundle();

        this.title = bundle.getString("title");
        this.message = bundle.getString("message");
        this.notificationId = bundle.getString("notId");
        this.notificationManager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);

        this.groupBuilder = new NotificationCompat.Builder(mContext, "rocketchatrn_channel_01")
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(smallIconResId)
            // .setStyle(NotificationCompat.InboxStyle().setSummaryText(title))
            .setContentIntent(intent)
            .setGroup("abc")
            .setGroupSummary(true);

        return getNotificationBuilder(intent).build();
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
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(smallIconResId)
            .setContentIntent(intent)
            .setGroup("abc");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notification.setColor(mContext.getColor(R.color.notification_text));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                                                                  CHANNEL_ID,
                                                                  NotificationManager.IMPORTANCE_DEFAULT);
            this.notificationManager.createNotificationChannel(channel);

            notification.setChannelId(CHANNEL_ID);
        }

        return notification;
    }

    @Override
    protected void postNotification(int id, Notification notification) {
        this.notificationManager.notify(new Random().nextInt(), notification);
        this.notificationManager.notify(Integer.parseInt(notificationId), groupBuilder.build());
    }
}
