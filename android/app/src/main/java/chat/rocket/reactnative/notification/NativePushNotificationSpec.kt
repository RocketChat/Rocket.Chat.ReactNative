package chat.rocket.reactnative.notification

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.TurboModule

abstract class NativePushNotificationSpec(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TurboModule {

    companion object {
        const val NAME = "PushNotificationModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    abstract fun getPendingNotification(promise: Promise)

    @ReactMethod
    abstract fun clearPendingNotification()
}

