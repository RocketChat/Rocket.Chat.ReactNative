package chat.rocket.reactnative;

import android.app.Application;
import android.content.Context;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.nozbe.watermelondb.WatermelonDBPackage;
import com.reactnativecommunity.viewpager.RNCViewPagerPackage;
import com.wix.reactnativekeyboardinput.KeyboardInputPackage;
import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;
import com.wix.reactnativenotifications.core.notification.INotificationsApplication;
import com.wix.reactnativenotifications.core.notification.IPushNotification;

import org.unimodules.adapters.react.ModuleRegistryAdapter;
import org.unimodules.adapters.react.ReactModuleRegistryProvider;

import java.util.Arrays;
import java.util.List;

import chat.rocket.reactnative.generated.BasePackageList;

public class MainApplication extends Application implements ReactApplication, INotificationsApplication {

  private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(new BasePackageList().getPackageList(), null);

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      packages.add(new KeyboardInputPackage(MainApplication.this));
      packages.add(new WatermelonDBPackage());
      packages.add(new RNCViewPagerPackage());
      List<ReactPackage> unimodules = Arrays.<ReactPackage>asList(
        new ModuleRegistryAdapter(mModuleRegistryProvider)
      );
      packages.addAll(unimodules);
      List<ReactPackage> additionalModules = new AdditionalModules().getAdditionalModules(MainApplication.this);
      packages.addAll(additionalModules);
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    protected @Nullable String getBundleAssetName() {
      return "app.bundle";
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
