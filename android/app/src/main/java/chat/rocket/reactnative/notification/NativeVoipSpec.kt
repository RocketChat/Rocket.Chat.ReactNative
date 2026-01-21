package chat.rocket.reactnative.notification

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.TurboModule

abstract class NativeVoipSpec(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TurboModule {

    companion object {
        const val NAME = "VoipModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    abstract fun getPendingVoipCall(promise: Promise)

    @ReactMethod
    abstract fun clearPendingVoipCall()
}
