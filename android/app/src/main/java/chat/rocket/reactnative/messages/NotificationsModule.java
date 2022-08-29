package chat.rocket.reactnative.messages;

import android.content.Intent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import javax.annotation.Nonnull;

public class NotificationsModule extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "Notifications";
    private static ReactApplicationContext reactContext;

    public NotificationsModule(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Nonnull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void startService() {
        this.reactContext.startService(new Intent(this.reactContext, NotificationsService.class));
    }

    @ReactMethod
    public void stopService() {
        this.reactContext.startService(new Intent(this.reactContext, NotificationsService.class));
    }
}
