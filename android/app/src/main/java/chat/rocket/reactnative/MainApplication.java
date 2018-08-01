package chat.rocket.reactnative;

import android.content.Context;
import android.os.Bundle;

import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.balthazargronon.RCTZeroconf.ZeroconfReactPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.crashlytics.android.Crashlytics;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.horcrux.svg.SvgPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.reactnativenavigation.NavigationApplication;
import com.remobile.toast.RCTToastPackage;
import com.rnim.rn.audio.ReactNativeAudioPackage;
import com.smixx.fabric.FabricPackage;
import com.wix.reactnativekeyboardinput.KeyboardInputPackage;
import com.wix.reactnativenotifications.RNNotificationsPackage;
import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.INotificationsApplication;
import com.wix.reactnativenotifications.core.notification.IPushNotification;

import java.util.Arrays;
import java.util.List;

import io.fabric.sdk.android.Fabric;
import io.realm.react.RealmReactPackage;

public class MainApplication extends NavigationApplication implements INotificationsApplication {

    private NotificationsLifecycleFacade notificationsLifecycleFacade;

    @Override
    public boolean isDebug() {
        return BuildConfig.DEBUG;
    }

    @Override
    public String getJSMainModuleName() {
        return "index.android";
    }

    protected List<ReactPackage> getPackages() {
        // Add additional packages you require here
        // No need to add RnnPackage and MainReactPackage
        return Arrays.<ReactPackage>asList(
        );
    }

    @Override
    public List<ReactPackage> createAdditionalReactPackages() {
        return Arrays.<ReactPackage>asList(
                new MainReactPackage(),
                new PickerPackage(),
                new SvgPackage(),
                new VectorIconsPackage(),
                new RNFetchBlobPackage(),
                new ZeroconfReactPackage(),
                new RealmReactPackage(),
                new ReactVideoPackage(),
                new RCTToastPackage(),
                new ReactNativeAudioPackage(),
                new KeyboardInputPackage(MainApplication.this),
                new RocketChatNativePackage(),
                new FabricPackage(),
                new FastImageViewPackage(),
                new RNI18nPackage(),
                new RNNotificationsPackage(MainApplication.this)
        );
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Fabric.with(this, new Crashlytics());

        // Create an object of the custom facade impl
        notificationsLifecycleFacade = new NotificationsLifecycleFacade();
        // Attach it to react-native-navigation
        setActivityCallbacks(notificationsLifecycleFacade);
    }

    @Override
    public IPushNotification getPushNotification(Context context, Bundle bundle, AppLifecycleFacade defaultFacade, AppLaunchHelper defaultAppLaunchHelper) {
        return new CustomPushNotification(
                context,
                bundle,
                notificationsLifecycleFacade, // Instead of defaultFacade!!!
                defaultAppLaunchHelper,
                new JsIOHelper()
        );
    }
}
