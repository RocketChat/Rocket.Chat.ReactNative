package chat.rocket.reactnative;

import android.os.Bundle;
import android.content.Intent;
import android.content.res.Configuration;
import android.Manifest;
import android.app.ActivityManager;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;

import com.facebook.react.ReactRootView;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactActivity;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import chat.rocket.reactnative.R.*;
import chat.rocket.reactnative.R.string.*;
import expo.modules.ReactActivityDelegateWrapper;

import com.zoontek.rnbootsplash.RNBootSplash;

//todo: remove unused location permissions
public class MainActivity extends ReactActivity {

    private static final int REQUEST_FOREGROUND_PERMISSIONS_REQUEST_CODE = 34;
    private static final int REQUEST_BACKGROUND_PERMISSIONS_REQUEST_CODE = 35;
    private static final String TAG = "AkelaMainActivity";

    private static final int MAXIMUM_LOCATION_REQUESTS_COUNT_BEFORE_ANDROID_BLOCKING = 2;

    private int foregroundPermissionsRequestCount;
    private int backgroundPermissionsRequestCount;
    // A reference to the service used to get location updates.
    //private LocationUpdatesService mService;

    // Tracks the bound state of the service.
    private boolean mBound;

    // Monitors the state of the connection to the service.`````
    private final ServiceConnection mServiceConnection = new ServiceConnection() {

        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            //LocationUpdatesService.LocalBinder binder = (LocationUpdatesService.LocalBinder) service;
            //mService = binder.getService();
            mBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            //mService = null;
            mBound = false;
        }
    };

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

    // from react-native-orientation
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }

    /**
    * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
    * you can specify the rendered you wish to use (Fabric or the older renderer).
    */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegateWrapper(this, new MainActivityDelegate(this, getMainComponentName()));
    }

    public static class MainActivityDelegate extends ReactActivityDelegate {
        public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
            super(activity, mainComponentName);
        }

        @Override
        protected ReactRootView createRootView() {
            ReactRootView reactRootView = new ReactRootView(getContext());
            // If you opted-in for the New Architecture, we enable the Fabric Renderer.
            reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
            return reactRootView;
        }
    }

    /**
      * Callback received when a permissions request has been completed.
      */
    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        if (requestCode == REQUEST_FOREGROUND_PERMISSIONS_REQUEST_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                handleForegroundPermissionsFlow(grantResults);
            }
        } else if (requestCode == REQUEST_BACKGROUND_PERMISSIONS_REQUEST_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                handleBackgroundPermissionsFlow(grantResults);
            }
        }
          //super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @RequiresApi(api = Build.VERSION_CODES.R)
    private void handleBackgroundPermissionsFlow(@NonNull int[] grantResults) {
        if (permissionGranted(grantResults)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !hasBackgroundPermissions()) {
                askForBackgroundPermissions();
            }

            // Permission was granted.
            //mService.requestLocationUpdates();
        } else {
            if (backgroundPermissionsRequestCount == MAXIMUM_LOCATION_REQUESTS_COUNT_BEFORE_ANDROID_BLOCKING) {
                //notifyUserBeforeExit();
            }
            else {
                askForBackgroundPermissions();
            }
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void handleForegroundPermissionsFlow(@NonNull int[] grantResults) {
        if (permissionGranted(grantResults)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !hasBackgroundPermissions()) // api level 30 and above requires background permissions separately
                askForBackgroundPermissions();
            else if (!hasBackgroundPermissions()) // if user did not grant `allow always` permission
                forceUserToAllowAlways();
            else {
                // Permission was granted.
                //mService.requestLocationUpdates();
            }
        } else {
            if (foregroundPermissionsRequestCount == MAXIMUM_LOCATION_REQUESTS_COUNT_BEFORE_ANDROID_BLOCKING){
                //notifyUserBeforeExit();
            } else {
                requestForegroundPermissions();
            }
        }
    }

    private boolean permissionGranted(@NonNull int[] grantResults) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
            return grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        else return grantResults.length > 0 && grantResults[1] == PackageManager.PERMISSION_GRANTED;
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private boolean hasBackgroundPermissions() {
        return hasPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION);
    }

    private boolean hasPermissions(@NonNull String permission) {
        return PackageManager.PERMISSION_GRANTED == ActivityCompat.checkSelfPermission(this,
                permission);
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void forceUserToAllowAlways() {
        (new AlertDialog.Builder(this))
                .setTitle(R.string.location_permission_title)
                .setMessage(R.string.foreground_location_permission_message)
                .setPositiveButton(
                        R.string.yes,
                        (dialogInterface, i) -> requestForegroundPermissions()
                )
                .setCancelable(false)
                .create()
                .show();
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void requestBackgroundPermissions() {
        // Request permission. It's possible this can be auto answered if device policy
        // sets the permission in a given state or the user denied the permission
        // previously and checked "Never ask again".
        requestLocationPermissions(new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}, REQUEST_BACKGROUND_PERMISSIONS_REQUEST_CODE);
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void askForBackgroundPermissions() {
        (new AlertDialog.Builder(this))
                .setTitle(R.string.location_permission_title)
                .setMessage(R.string.background_location_permission_message_api30)
                .setPositiveButton(
                        R.string.yes,
                        (dialogInterface, i) -> requestBackgroundPermissions()
                )
                .setCancelable(false)
                .create()
                .show();
    }



    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void requestForegroundPermissions() {
        // Request permission. It's possible this can be auto answered if device policy
        // sets the permission in a given state or the user denied the permission
        // previously and checked "Never ask again".
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
            requestLocationPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_BACKGROUND_LOCATION}, REQUEST_FOREGROUND_PERMISSIONS_REQUEST_CODE);
        } else {
            requestLocationPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, REQUEST_FOREGROUND_PERMISSIONS_REQUEST_CODE);
        }
    }

    private void requestLocationPermissions(@NonNull String[] permissions, int requestCode) {
        if (requestCode == REQUEST_FOREGROUND_PERMISSIONS_REQUEST_CODE)
            foregroundPermissionsRequestCount++;
        else if (requestCode == REQUEST_BACKGROUND_PERMISSIONS_REQUEST_CODE)
            backgroundPermissionsRequestCount++;
        ActivityCompat.requestPermissions(MainActivity.this,
                permissions,
                requestCode);
    }
}
