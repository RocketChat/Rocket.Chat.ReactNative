package chat.rocket.reactnative;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CallkeepHelperModule extends ReactContextBaseJavaModule {

  private static ReactApplicationContext reactContext;

  CallkeepHelperModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @Override
  public String getName() {
    return "CallkeepHelperModule";
  }

  @RequiresApi(api = Build.VERSION_CODES.O_MR1)
  @ReactMethod
  public void dismissKeyguard(Activity activity){
    KeyguardManager keyguardManager = (KeyguardManager) reactContext.getSystemService(
      Context.KEYGUARD_SERVICE
    );
    boolean isLocked = keyguardManager.isKeyguardLocked();
    if (isLocked) {
      Log.d("CallkeepHelperModule", "lockscreen");
      keyguardManager.requestDismissKeyguard(
        activity,
        new KeyguardManager.KeyguardDismissCallback() {
          @Override
          public void onDismissError() {
            Log.d("CallkeepHelperModule", "onDismissError");
          }

          @Override
          public void onDismissSucceeded() {
            Log.d("CallkeepHelperModule", "onDismissSucceeded");
          }

          @Override
          public void onDismissCancelled() {
            Log.d("CallkeepHelperModule", "onDismissCancelled");
          }
        }
      );
    } else {
      Log.d("CallkeepHelperModule", "unlocked");
    }
  }

  @ReactMethod
  public void startActivity() {
    Log.d("CallkeepHelperModule", "start activity");
    Context context = getAppContext();
    String packageName = context.getApplicationContext().getPackageName();
    Intent focusIntent = context.getPackageManager().getLaunchIntentForPackage(packageName).cloneFilter();
    Activity activity = getCurrentActivity();
    boolean isRunning = activity != null;

    if(isRunning){
      Log.d("CallkeepHelperModule", "activity is running");
      focusIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      activity.startActivity(focusIntent);
      dismissKeyguard(activity);
    } else {
      Log.d("CallkeepHelperModule", "activity is not running, starting activity");
      focusIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK + Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      context.startActivity(focusIntent);
    }
  }

  private Context getAppContext() {
    return this.reactContext.getApplicationContext();
  }
}