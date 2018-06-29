package chat.rocket.reactnative;

import android.graphics.drawable.Drawable;
import android.support.v4.content.ContextCompat;
import android.widget.LinearLayout;
import com.reactnativenavigation.controllers.SplashActivity;

public class MainActivity extends SplashActivity {
    @Override
    public LinearLayout createSplashLayout() {
        LinearLayout splash = new LinearLayout(this);
        Drawable launch_screen_bitmap = ContextCompat.getDrawable(getApplicationContext(),R.drawable.launch_screen_bitmap);
        splash.setBackground(launch_screen_bitmap);

        return splash;
    }
}
