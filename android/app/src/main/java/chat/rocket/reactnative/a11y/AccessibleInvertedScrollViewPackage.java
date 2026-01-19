package chat.rocket.reactnative.a11y;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * ReactPackage for AccessibleInvertedScrollView.
 * 
 * Registers the AccessibleInvertedScrollViewManager to make the custom
 * scroll view available to React Native.
 */
public class AccessibleInvertedScrollViewPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> viewManagers = new ArrayList<>();
        viewManagers.add(new AccessibleInvertedScrollViewManager());
        return viewManagers;
    }
}
