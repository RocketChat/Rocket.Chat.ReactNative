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

    /**
     * Registers for VoIP push token.
     * iOS: Triggers PushKit registration.
     * Android: No-op (uses FCM for push notifications).
     */
    @ReactMethod
    abstract fun registerVoipToken()

    @ReactMethod(isBlockingSynchronousMethod = true)
    abstract fun getPendingVoipCall(): WritableMap?

    @ReactMethod
    abstract fun clearPendingVoipCall()

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS starts listening to events.
     */
    @ReactMethod
    abstract fun addListener(eventName: String)

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS stops listening to events.
     */
    @ReactMethod
    abstract fun removeListeners(count: Double)
}
