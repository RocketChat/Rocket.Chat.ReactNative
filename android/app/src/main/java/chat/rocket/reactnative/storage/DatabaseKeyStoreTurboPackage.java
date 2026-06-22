package chat.rocket.reactnative.storage;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;

import java.util.HashMap;
import java.util.Map;

public class DatabaseKeyStoreTurboPackage extends TurboReactPackage {

    @Nullable
    @Override
    public NativeModule getModule(String name, ReactApplicationContext reactContext) {
        if (name.equals(NativeDatabaseKeyStoreSpec.NAME)) {
            return new DatabaseKeyStoreModule(reactContext);
        } else {
            return null;
        }
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return () -> {
            final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
            moduleInfos.put(
                    NativeDatabaseKeyStoreSpec.NAME,
                    new ReactModuleInfo(
                            NativeDatabaseKeyStoreSpec.NAME,
                            NativeDatabaseKeyStoreSpec.NAME,
                            false, // canOverrideExistingModule
                            false, // needsEagerInit
                            false, // hasConstants
                            false, // isCxxModule
                            true   // isTurboModule
                    ));
            return moduleInfos;
        };
    }
}
