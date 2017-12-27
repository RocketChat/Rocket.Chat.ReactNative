package com.rocketchatrn;

import android.net.Uri;
import android.support.customtabs.CustomTabsIntent;


import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


/**
 * Created by saketkumar on 27/12/17.
 */

public class CustomTabsAndroid extends ReactContextBaseJavaModule {

    private ReactApplicationContext context;


    CustomTabsAndroid(ReactApplicationContext reactContext) {
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
