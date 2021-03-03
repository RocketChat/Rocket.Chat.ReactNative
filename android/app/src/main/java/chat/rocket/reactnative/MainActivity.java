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
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        moveTaskToBack(true);
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

