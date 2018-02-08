package chat.rocket.reactnative;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.horcrux.svg.SvgPackage;
import com.imagepicker.ImagePickerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.balthazargronon.RCTZeroconf.ZeroconfReactPackage;
import io.realm.react.RealmReactPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.remobile.toast.RCTToastPackage;
import com.wix.reactnativekeyboardinput.KeyboardInputPackage;

import java.util.Arrays;
import java.util.List;
import org.devio.rn.splashscreen.SplashScreenReactPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
			  new MainReactPackage(),
        new SvgPackage(),
        new ImagePickerPackage(),
        new VectorIconsPackage(),
        new RNFetchBlobPackage(),
        new ZeroconfReactPackage(),
        new RealmReactPackage(),
        new ReactNativePushNotificationPackage(),
        new ReactVideoPackage(),
        new SplashScreenReactPackage(),
        new RCTToastPackage(),
        new KeyboardInputPackage(MainApplication.this)
      );
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
}
