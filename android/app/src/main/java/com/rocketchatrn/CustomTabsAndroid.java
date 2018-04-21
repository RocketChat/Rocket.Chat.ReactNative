package chat.rocket.reactnative;

import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.support.customtabs.CustomTabsIntent;
import android.widget.Toast;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.List;

import chat.rocket.reactnative.R;

/**
 * Launches custom tabs.
 */

public class CustomTabsAndroid extends ReactContextBaseJavaModule {


    public CustomTabsAndroid(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CustomTabsAndroid";
    }

    @ReactMethod
    public void openURL(String url) throws NullPointerException {
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        CustomTabsIntent customTabsIntent = builder.build();

        if (CustomTabsHelper.isChromeCustomTabsSupported(getReactApplicationContext())) {
            customTabsIntent.launchUrl(getReactApplicationContext().getCurrentActivity(), Uri.parse(url));
        } else {
            //open in browser
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setData(Uri.parse(url));
            //ensure browser is present
            final List<ResolveInfo> customTabsApps = getReactApplicationContext()
                    .getCurrentActivity().getPackageManager().queryIntentActivities(i, 0);

            if (customTabsApps.size() > 0) {
                getReactApplicationContext().startActivity(i);
            } else {
                // no browser
                Toast.makeText(getReactApplicationContext(), R.string.no_browser_found, Toast.LENGTH_SHORT).show();
            }
        }
    }
}
