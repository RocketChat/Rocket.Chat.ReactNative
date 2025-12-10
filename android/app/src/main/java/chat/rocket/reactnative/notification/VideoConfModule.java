package chat.rocket.reactnative.notification;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Native module to expose video conference notification actions to JavaScript.
 * Used to retrieve pending video conf actions when the app opens.
 */
@ReactModule(name = VideoConfModule.NAME)
public class VideoConfModule extends ReactContextBaseJavaModule {
    public static final String NAME = "VideoConfModule";
    private static final String PREFS_NAME = "RocketChatPrefs";
    private static final String KEY_VIDEO_CONF_ACTION = "videoConfAction";
    
    public VideoConfModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    @NonNull
    public String getName() {
        return NAME;
    }
    
    /**
     * Gets any pending video conference action.
     * Returns null if no pending action.
     */
    @ReactMethod
    public void getPendingAction(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String action = prefs.getString(KEY_VIDEO_CONF_ACTION, null);
            
            // Clear the action after reading
            if (action != null) {
                prefs.edit().remove(KEY_VIDEO_CONF_ACTION).apply();
            }
            
            promise.resolve(action);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Clears any pending video conference action.
     */
    @ReactMethod
    public void clearPendingAction() {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().remove(KEY_VIDEO_CONF_ACTION).apply();
        } catch (Exception e) {
            // Ignore errors
        }
    }
    
    /**
     * Stores a video conference action.
     * Called from native code when user interacts with video conf notification.
     */
    public static void storePendingAction(Context context, String actionJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_VIDEO_CONF_ACTION, actionJson).apply();
    }
}
