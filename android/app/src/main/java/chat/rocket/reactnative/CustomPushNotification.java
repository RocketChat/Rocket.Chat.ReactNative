package chat.rocket.reactnative;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.net.Uri;
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

        final Notification.Builder notification = new Notification.Builder(mContext);
        notification
            .setSmallIcon(smallIconResId)
            .setContentIntent(intent)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new Notification.BigTextStyle().bigText(message))
            .setPriority(Notification.PRIORITY_HIGH)
            .setColor(mContext.getColor(R.color.notification_text))
            .setDefaults(Notification.DEFAULT_ALL)
            .setAutoCancel(true);

        Bitmap largeIconBitmap = BitmapFactory.decodeResource(res, largeIconResId);
        notification.setLargeIcon(largeIconBitmap);

        return notification;
    }
}
