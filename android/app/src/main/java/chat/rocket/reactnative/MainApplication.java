package chat.rocket.reactnative;

import android.app.Application;

import com.facebook.react.ReactApplication;
import io.github.elyx0.reactnativedocumentpicker.DocumentPickerPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.perf.RNFirebasePerformancePackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import org.wonday.orientation.OrientationPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import com.reactcommunity.rnlocalize.RNLocalizePackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.rnim.rn.audio.ReactNativeAudioPackage;
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
import io.realm.react.RealmReactPackage;
import com.swmansion.rnscreens.RNScreensPackage;

import chat.rocket.reactnative.generated.BasePackageList;

import org.unimodules.adapters.react.ModuleRegistryAdapter;
import org.unimodules.adapters.react.ReactModuleRegistryProvider;
import org.unimodules.core.interfaces.SingletonModule;

import android.content.Context;
import android.os.Bundle;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication, INotificationsApplication {

  private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(new BasePackageList().getPackageList(), Arrays.<SingletonModule>asList());

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new DocumentPickerPackage(),
            new RNFirebasePackage(),
            new RNFirebaseCrashlyticsPackage(),
            new RNFirebaseAnalyticsPackage(),
            new RNFirebasePerformancePackage(),
            new RNCWebViewPackage(),
            new OrientationPackage(),
            new SplashScreenReactPackage(),
		  		new RNGestureHandlerPackage(),
					new RNScreensPackage(),
					new ActionSheetPackage(),
					new RNDeviceInfo(),
					new PickerPackage(),
					new VectorIconsPackage(),
					new RealmReactPackage(),
					new ReactVideoPackage(),
					new ReactNativeAudioPackage(),
					new KeyboardInputPackage(MainApplication.this),
					new FastImageViewPackage(),
					new RNLocalizePackage(),
          new RNNotificationsPackage(MainApplication.this),
          new ModuleRegistryAdapter(mModuleRegistryProvider)
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
