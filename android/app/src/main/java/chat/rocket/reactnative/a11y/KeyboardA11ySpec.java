package chat.rocket.reactnative.a11y;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class KeyboardA11ySpec extends ReactContextBaseJavaModule implements TurboModule {

  public static final String NAME = "KeyboardA11y";

  public KeyboardA11ySpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public abstract void enable(String scope);

  @ReactMethod
  public abstract void disable();

  @ReactMethod
  public abstract void getState(Promise promise);
}

