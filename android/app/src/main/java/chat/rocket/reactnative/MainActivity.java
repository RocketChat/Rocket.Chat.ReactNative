package chat.rocket.reactnative;

import android.graphics.drawable.Drawable;
import android.support.v4.content.ContextCompat;
import android.widget.LinearLayout;
// import com.reactnativenavigation.controllers.SplashActivity;
import com.reactnativenavigation.NavigationActivity;
import android.view.View;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;

public class MainActivity extends NavigationActivity {

	@Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

	@Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View view = new View(this);
        view.setBackgroundResource(R.drawable.launch_screen_bitmap);
        setContentView(view);
    }
}

// public class MainActivity extends SplashActivity {
//     @Override
//     public LinearLayout createSplashLayout() {
//         LinearLayout splash = new LinearLayout(this);
//         Drawable launch_screen_bitmap = ContextCompat.getDrawable(getApplicationContext(),R.drawable.launch_screen_bitmap);
//         splash.setBackground(launch_screen_bitmap);

//         return splash;
//     }
// }
