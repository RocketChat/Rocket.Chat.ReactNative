package chat.rocket.reactnative.voip

import android.util.Log
import chat.rocket.reactnative.BuildConfig
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import chat.rocket.reactnative.networking.NativeVoipSpec
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicReference

/**
 * Native module to expose VoIP call data to JavaScript.
 * Used to retrieve pending VoIP call data when the app opens from a VoIP notification.
 */
class VoipModule(reactContext: ReactApplicationContext) : NativeVoipSpec(reactContext) {

    companion object {
        private const val TAG = "RocketChat.VoipModule"
        private const val EVENT_VOIP_ACCEPT_SUCCEEDED = "VoipAcceptSucceeded"
        private const val EVENT_VOIP_ACCEPT_FAILED = "VoipAcceptFailed"
        private const val EVENT_VOIP_PENDING_ACCEPT = "VoipPendingAccept"

        private var reactContextRef: WeakReference<ReactApplicationContext>? = null

        private val initialEventsData = AtomicReference<VoipPayload?>(null)

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
                            .emit(EVENT_VOIP_ACCEPT_SUCCEEDED, voipPayload.toWritableMap())
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
            initialEventsData.set(voipPayload)
            emitInitialEventsEvent(voipPayload)
        }

        /**
         * Stash native accept failure for cold start [getInitialEvents] and emit [EVENT_VOIP_ACCEPT_FAILED] when JS is running.
         */
        @JvmStatic
        fun storeAcceptFailureForJs(payload: VoipPayload) {
            val failed = payload.copy(voipAcceptFailed = true)
            initialEventsData.set(failed)
            emitVoipAcceptFailedEvent(failed)
        }

        private fun emitVoipAcceptFailedEvent(voipPayload: VoipPayload) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_VOIP_ACCEPT_FAILED, voipPayload.toWritableMap())
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit VoipAcceptFailed", e)
            }
        }

        @JvmStatic
        fun emitPendingAcceptEvent(voipPayload: VoipPayload) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_VOIP_PENDING_ACCEPT, mapOf("callId" to voipPayload.callId, "payload" to voipPayload.toWritableMap()))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit VoipPendingAccept", e)
            }
        }

        @JvmStatic
        fun clearInitialEventsInternal() {
            try {
                initialEventsData.set(null)
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
        while (true) {
            val data = initialEventsData.get() ?: return null

            if (data.isExpired()) {
                if (BuildConfig.DEBUG) {
                    Log.d(TAG, "Discarding expired VoIP initial event: ${data.callId}")
                }
                if (initialEventsData.compareAndSet(data, null)) {
                    return null
                }
                continue
            }

            val result = data.toWritableMap()
            if (initialEventsData.compareAndSet(data, null)) {
                return result
            }
        }
    }

    /**
     * Clears any initial events.
     */
    override fun clearInitialEvents() {
        clearInitialEventsInternal()
    }

    // No-op on Android - FCM handles push notifications
    override fun getLastVoipToken(): String = ""

    /**
     * Registers for VoIP push token.
     * No-op on Android - uses FCM for push notifications.
     */
    override fun registerVoipToken() {
        // No-op on Android - FCM handles push notifications
        Log.d(TAG, "registerVoipToken called (no-op on Android)")
    }

    override fun stopNativeDDPClient() {
        Log.d(TAG, "stopNativeDDPClient called, stopping native DDP client")
        VoipNotification.stopDDPClient()
    }

    override fun stopVoipCallService() {
        try {
            VoipCallService.stopService(reactApplicationContext)
            Log.d(TAG, "stopVoipCallService: service stopped")
        } catch (e: Exception) {
            Log.e(TAG, "stopVoipCallService: failed to stop service", e)
        }
    }

    /**
     * Continues a native-accepted VoIP call that was queued in the pending-accept window.
     * Android: No-op (Android handles accept natively via Telecom).
     */
    override fun proceedAccept(callId: String) {
        Log.d(TAG, "proceedAccept called on Android (no-op)")
    }

    /**
     * Required for NativeEventEmitter in TurboModules.
     * Called when JS starts listening to events.
     */
    override fun addListener(eventName: String) {
        // Keep track of listeners if needed
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "addListener: $eventName")
        }
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
