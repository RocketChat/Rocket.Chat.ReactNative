package chat.rocket.reactnative.voip

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.bridge.WritableMap

abstract class NativeVoipSpec(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TurboModule {

    companion object {
        const val NAME = "VoipModule"
    }

    override fun getName(): String = NAME

    @ReactMethod(isBlockingSynchronousMethod = true)
    abstract fun getPendingVoipCall(): WritableMap?

    @ReactMethod
    abstract fun clearPendingVoipCall()
}
