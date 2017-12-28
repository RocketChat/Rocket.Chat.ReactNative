package com.rocketchatrn;

import android.net.Uri;
import android.support.customtabs.CustomTabsIntent;


import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


/**
 * Launches custom tabs.
 */

public class CustomTabsAndroid extends ReactContextBaseJavaModule {

    public ReactApplicationContext context;


    public CustomTabsAndroid(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
    }

    @Override
    public String getName() {
        return "CustomTabsAndroid";
    }

    @ReactMethod
    public void openURL(String url) throws NullPointerException {
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        CustomTabsIntent customTabsIntent = builder.build();
        customTabsIntent.launchUrl(getReactApplicationContext().getCurrentActivity(), Uri.parse(url));
    }
}
