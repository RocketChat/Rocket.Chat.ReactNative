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

class SortPreferences {
  String sortBy;
  Boolean groupByType;
  Boolean showFavorites;
  Boolean showUnread;
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

            // Theme preferences object
            String THEME_PREFERENCES_KEY = "RC_THEME_PREFERENCES_KEY";
            String themeJson = sharedPreferences.getString(THEME_PREFERENCES_KEY, "");
            if (!themeJson.isEmpty()) {
              ThemePreferences themePreferences = new Gson().fromJson(themeJson, ThemePreferences.class);
              WritableMap themeMap = new Arguments().createMap();
              themeMap.putString("currentTheme", themePreferences.currentTheme);
              themeMap.putString("darkLevel", themePreferences.darkLevel);
              Bundle bundle = Arguments.toBundle(themeMap);
              mmkv.encode(THEME_PREFERENCES_KEY, bundle);
            }

            // Sort preferences object
            String SORT_PREFS_KEY = "RC_SORT_PREFS_KEY";
            String sortJson = sharedPreferences.getString(SORT_PREFS_KEY, "");
            if (!sortJson.isEmpty()) {
              SortPreferences sortPreferences = new Gson().fromJson(sortJson, SortPreferences.class);
              WritableMap sortMap = new Arguments().createMap();
              sortMap.putString("sortBy", sortPreferences.sortBy);
              if (sortPreferences.groupByType != null) {
                sortMap.putBoolean("groupByType", sortPreferences.groupByType);
              }
              if (sortPreferences.showFavorites != null) {
                sortMap.putBoolean("showFavorites", sortPreferences.showFavorites);
              }
              if (sortPreferences.showUnread != null) {
                sortMap.putBoolean("showUnread", sortPreferences.showUnread);
              }
              Bundle bundle = Arguments.toBundle(sortMap);
              mmkv.encode(SORT_PREFS_KEY, bundle);
            }

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

