package chat.rocket.reactnative.voip

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference
import chat.rocket.reactnative.NativeVoipSpec

/**
 * Native module to expose VoIP call data to JavaScript.
 * Used to retrieve pending VoIP call data when the app opens from a VoIP notification.
 */
class VoipModule(reactContext: ReactApplicationContext) : NativeVoipSpec(reactContext) {

    companion object {
        private const val TAG = "RocketChat.VoipModule"
        private const val EVENT_INITIAL_EVENTS = "VoipPushInitialEvents"

        private var reactContextRef: WeakReference<ReactApplicationContext>? = null
        private var initialEventsData: VoipPayload? = null
        private var initialEventsTimestamp: Long = 0

        /**
         * Sets the React context reference for event emission.
         */
        @JvmStatic
        fun setReactContext(context: ReactApplicationContext) {
            reactContextRef = WeakReference(context)
        }

        /**
         * Emits a VoIP call event to JavaScript when the app is running.
         */
        @JvmStatic
        fun emitInitialEventsEvent(voipPayload: VoipPayload) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_INITIAL_EVENTS, voipPayload.toWritableMap())
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit VoIP call event", e)
            }
        }

        /**
         * Stores VoIP call data for JS to retrieve.
         * Also emits an event if the app is running.
         */
        @JvmStatic
        fun storeInitialEvents(voipPayload: VoipPayload) {
            initialEventsData = voipPayload
            initialEventsTimestamp = System.currentTimeMillis()
            emitInitialEventsEvent(voipPayload)
        }

        @JvmStatic
        fun clearInitialEventsInternal() {
            try {
                initialEventsData = null
                initialEventsTimestamp = 0
                Log.d(TAG, "Cleared initial events")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing initial events", e)
            }
        }
    }

    init {
        // Store reference for event emission
        setReactContext(reactApplicationContext)
    }

    /**
     * Gets any initial events.
     * Returns null if no initial events.
     */
    override fun getInitialEvents(): WritableMap? {
        val data = initialEventsData ?: return null

        if (System.currentTimeMillis() - initialEventsTimestamp > 5 * 60 * 1000) {
            clearInitialEventsInternal()
            return null
        }

        val result = data.toWritableMap()
        clearInitialEventsInternal()
        
        return result
    }

    /**
     * Clears any initial events.
     */
    override fun clearInitialEvents() {
        clearInitialEventsInternal()
    }

    /**
     * Registers for VoIP push token.
     * No-op on Android - uses FCM for push notifications.
     */
    override fun registerVoipToken() {
        // No-op on Android - FCM handles push notifications
        Log.d(TAG, "registerVoipToken called (no-op on Android)")
    }

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS starts listening to events.
     */
    override fun addListener(eventName: String) {
        // Keep track of listeners if needed
        Log.d(TAG, "addListener: $eventName")
    }

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS stops listening to events.
     */
    override fun removeListeners(count: Double) {
        // Remove listeners if needed
        Log.d(TAG, "removeListeners: $count")
    }
}
