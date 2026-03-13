package chat.rocket.reactnative.a11y;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = KeyboardA11ySpec.NAME)
public class KeyboardA11yModule extends KeyboardA11ySpec {

  private static volatile boolean sEnabled = false;
  @Nullable
  private static volatile String sScope = null;

  public KeyboardA11yModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  public static boolean isEnabled() {
    return sEnabled;
  }

  @Nullable
  public static String getScope() {
    return sScope;
  }

  @Override
  public void enable(String scope) {
    sEnabled = true;
    sScope = scope;
  }

  @Override
  public void disable() {
    sEnabled = false;
    sScope = null;
  }

  @Override
  public void getState(Promise promise) {
    WritableMap state = com.facebook.react.bridge.Arguments.createMap();
    state.putBoolean("enabled", sEnabled);
    state.putString("scope", sScope);
    promise.resolve(state);
  }
}

