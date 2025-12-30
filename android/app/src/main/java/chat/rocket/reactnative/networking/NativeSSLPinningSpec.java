package chat.rocket.reactnative.networking;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeSSLPinningSpec extends ReactContextBaseJavaModule implements TurboModule {

  public static final String NAME = "SSLPinning";

  public NativeSSLPinningSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public abstract void setCertificate(String name, Promise promise);

  @ReactMethod
  public abstract void pickCertificate(Promise promise);
}
