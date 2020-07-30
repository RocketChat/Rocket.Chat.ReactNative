package chat.rocket.reactnative;

import android.content.Context;

import com.facebook.react.ReactInstanceManager;

public class MainDebugApplication extends MainApplication  {

  @Override
  public void onCreate() {
    super.onCreate();
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
    ReactNativeFlipper.initializeFlipper(context, reactInstanceManager);
  }
}
