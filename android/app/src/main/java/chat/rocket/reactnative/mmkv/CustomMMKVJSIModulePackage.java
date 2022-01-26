package chat.rocket.reactnative.mmkv;

import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import java.util.List;

import com.swmansion.reanimated.ReanimatedJSIModulePackage;
import com.ammarahmed.mmkv.RNMMKVModule;

public class CustomMMKVJSIModulePackage extends ReanimatedJSIModulePackage {
    @Override
    public List<JSIModuleSpec> getJSIModules(ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext) {
        reactApplicationContext.getNativeModule(RNMMKVModule.class).installLib(jsContext, reactApplicationContext.getFilesDir().getAbsolutePath() + "/mmkv");
        return super.getJSIModules(reactApplicationContext, jsContext);
    }
}
