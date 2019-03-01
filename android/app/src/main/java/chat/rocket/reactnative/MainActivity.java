// package chat.rocket.reactnative;

// import android.graphics.drawable.Drawable;
// import android.support.v4.content.ContextCompat;
// import android.widget.LinearLayout;
// // import com.reactnativenavigation.controllers.SplashActivity;
// import com.reactnativenavigation.NavigationActivity;
// import android.view.View;
// import android.content.Intent;
// import android.os.Bundle;
// import android.support.annotation.Nullable;

// public class MainActivity extends NavigationActivity {

// 	@Override
//     public void onNewIntent(Intent intent) {
//         super.onNewIntent(intent);
//         setIntent(intent);
//     }

// 	@Override
//     protected void onCreate(@Nullable Bundle savedInstanceState) {
//         super.onCreate(savedInstanceState);

//         View view = new View(this);
//         view.setBackgroundResource(R.drawable.launch_screen_bitmap);
//         setContentView(view);
//     }
// }

package chat.rocket.reactnative;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.os.Bundle;
import com.facebook.react.ReactFragmentActivity;

public class MainActivity extends ReactFragmentActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
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
}

