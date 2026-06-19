package chat.rocket.reactnative.storage;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeDatabaseKeyStoreSpec extends ReactContextBaseJavaModule implements TurboModule {

  public static final String NAME = "DatabaseKeyStoreModule";

  public NativeDatabaseKeyStoreSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  public abstract void getItem(String key, Promise promise);

  public abstract void setItem(String key, String value, Promise promise);

  public abstract void removeItem(String key, Promise promise);
}
