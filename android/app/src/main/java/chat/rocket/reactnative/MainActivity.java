package chat.rocket.reactnative;

import android.os.Bundle;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.ReactRootView;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactFragmentActivity;

import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import com.zoontek.rnbootsplash.RNBootSplash;
import com.tencent.mmkv.MMKV;
import com.google.gson.Gson;

class ThemePreferences {
  String currentTheme;
  String darkLevel;
}

public class MainActivity extends ReactFragmentActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
        super.onCreate(null);
        RNBootSplash.init(R.drawable.launch_screen, MainActivity.this);

        MMKV.initialize(MainActivity.this);

        // Start the MMKV container
        MMKV defaultMMKV = MMKV.defaultMMKV();
        boolean alreadyMigrated = defaultMMKV.decodeBool("alreadyMigrated");

        if (!alreadyMigrated) {
            // MMKV Instance that will be used by JS
            MMKV mmkv = MMKV.mmkvWithID("default");

            // SharedPreferences -> MMKV (Migration)
            SharedPreferences sharedPreferences = getSharedPreferences("react-native", Context.MODE_PRIVATE);
            mmkv.importFromSharedPreferences(sharedPreferences);

            // SharedPreferences only save strings, so we saved this value as a String and now we'll need to cast into a MMKV object
            String THEME_PREFERENCES_KEY = "RC_THEME_PREFERENCES_KEY";
            String themeJson = sharedPreferences.getString(THEME_PREFERENCES_KEY, "{}");
            ThemePreferences themePreferences = new Gson().fromJson(themeJson, ThemePreferences.class);
            WritableMap map = new Arguments().createMap();
            map.putString("currentTheme", themePreferences.currentTheme);
            map.putString("darkLevel", themePreferences.darkLevel);
            Bundle bundle = Arguments.toBundle(map);
            mmkv.encode(THEME_PREFERENCES_KEY, bundle);

            // Remove all our keys of SharedPreferences
            sharedPreferences.edit().clear().commit();
          
            // Mark migration complete
            defaultMMKV.encode("alreadyMigrated", true);
        }
    }

    /**
    * Returns the name of the main component registered from JavaScript. This is used to schedule
    * rendering of the component.
    */
    @Override
    protected String getMainComponentName() {
        return "RocketChatRN";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
      return new ReactActivityDelegate(this, getMainComponentName()) {
        @Override
        protected ReactRootView createRootView() {
         return new RNGestureHandlerEnabledRootView(MainActivity.this);
        }
      };
    }

    // from react-native-orientation
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }
}

