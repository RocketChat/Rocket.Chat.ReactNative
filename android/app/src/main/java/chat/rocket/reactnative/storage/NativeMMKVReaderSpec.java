package chat.rocket.reactnative.storage;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeMMKVReaderSpec extends ReactContextBaseJavaModule implements TurboModule {

    public static final String NAME = "MMKVReader";

    public NativeMMKVReaderSpec(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public abstract void readAndDecryptMMKV(String mmkvId, Promise promise);

    @ReactMethod
    public abstract void listMMKVFiles(Promise promise);
    
    @ReactMethod
    public abstract void getStoragePath(Promise promise);
}

