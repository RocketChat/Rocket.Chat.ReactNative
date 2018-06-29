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
import com.rnim.rn.audio.ReactNativeAudioPackage;
import com.smixx.fabric.FabricPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
import com.reactnativenavigation.NavigationApplication;

import java.util.Arrays;
import java.util.List;

import io.fabric.sdk.android.Fabric;
import com.crashlytics.android.Crashlytics;

public class MainApplication extends NavigationApplication {

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  @Override
  public String getJSMainModuleName() {
      return "index";
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
      new SvgPackage(),
      new ImagePickerPackage(),
      new VectorIconsPackage(),
      new RNFetchBlobPackage(),
      new ZeroconfReactPackage(),
      new RealmReactPackage(),
      new ReactNativePushNotificationPackage(),
      new ReactVideoPackage(),
      new RCTToastPackage(),
      new ReactNativeAudioPackage(),
      new KeyboardInputPackage(MainApplication.this),
      new RocketChatNativePackage(),
      new FabricPackage(),
      new FastImageViewPackage(),
      new RNI18nPackage()
		);
	}

	@Override
 	public void onCreate() {
   	super.onCreate();
   	Fabric.with(this, new Crashlytics());
 	}
}
