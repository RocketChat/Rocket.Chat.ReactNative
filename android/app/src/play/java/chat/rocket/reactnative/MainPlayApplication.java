package chat.rocket.reactnative;

import android.content.Context;
import android.os.Bundle;

import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.INotificationsApplication;
import com.wix.reactnativenotifications.core.notification.IPushNotification;
import com.bugsnag.android.Bugsnag;

public class MainPlayApplication extends MainApplication implements INotificationsApplication {
    @Override
    public void onCreate() {
        super.onCreate();
        Bugsnag.start(this);
    }

    @Override
    public IPushNotification getPushNotification(Context context, Bundle bundle, AppLifecycleFacade defaultFacade, AppLaunchHelper defaultAppLaunchHelper) {
        return new CustomPushNotification(
                context,
                bundle,
                defaultFacade,
                defaultAppLaunchHelper,
                new JsIOHelper()
        );
    }
}
