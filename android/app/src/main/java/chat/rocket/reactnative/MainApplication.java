package chat.rocket.reactnative;

import android.app.Application;

import com.facebook.react.ReactApplication;
import org.wonday.orientation.OrientationPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.crashlytics.android.Crashlytics;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.rnim.rn.audio.ReactNativeAudioPackage;
import com.smixx.fabric.FabricPackage;
import com.wix.reactnativekeyboardinput.KeyboardInputPackage;
import com.wix.reactnativenotifications.RNNotificationsPackage;
import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.INotificationsApplication;
import com.wix.reactnativenotifications.core.notification.IPushNotification;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.actionsheet.ActionSheetPackage;
import io.fabric.sdk.android.Fabric;
import io.realm.react.RealmReactPackage;
import com.swmansion.rnscreens.RNScreensPackage;

import android.content.Context;
import android.os.Bundle;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication, INotificationsApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new OrientationPackage(),
            new SplashScreenReactPackage(),
		  		new RNGestureHandlerPackage(),
					new RNScreensPackage(),
					new ActionSheetPackage(),
					new RNDeviceInfo(),
					new PickerPackage(),
					new VectorIconsPackage(),
					new RNFetchBlobPackage(),
					new RealmReactPackage(),
					new ReactVideoPackage(),
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
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
		Fabric.with(this, new Crashlytics());
    SoLoader.init(this, /* native exopackage */ false);
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
