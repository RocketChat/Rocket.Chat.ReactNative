package chat.rocket.reactnative.voip

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference

/**
 * Native module to expose VoIP call data to JavaScript.
 * Used to retrieve pending VoIP call data when the app opens from a VoIP notification.
 */
class VoipModule(reactContext: ReactApplicationContext) : NativeVoipSpec(reactContext) {

    companion object {
        private const val TAG = "RocketChat.VoipModule"
        private const val EVENT_VOIP_CALL = "VoipCallAccepted"

        private var reactContextRef: WeakReference<ReactApplicationContext>? = null
        private var pendingVoipCallData: VoipPayload? = null
        private var pendingVoipCallTimestamp: Long = 0

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
        fun emitVoipCallEvent(voipPayload: VoipPayload) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_VOIP_CALL, voipPayload.toWritableMap())
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
        fun storePendingVoipCall(voipPayload: VoipPayload) {
            pendingVoipCallData = voipPayload
            pendingVoipCallTimestamp = System.currentTimeMillis()
            emitVoipCallEvent(voipPayload)
        }

        @JvmStatic
        fun clearPendingVoipCallInternal() {
            try {
                pendingVoipCallData = null
                pendingVoipCallTimestamp = 0
                Log.d(TAG, "Cleared pending VoIP call data")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing pending VoIP call", e)
            }
        }
    }

    init {
        // Store reference for event emission
        setReactContext(reactApplicationContext)
    }

    /**
     * Gets any pending VoIP call data.
     * Returns null if no pending call.
     */
    @ReactMethod
    override fun getPendingVoipCall(): WritableMap? {
        val data = pendingVoipCallData ?: return null

        if (System.currentTimeMillis() - pendingVoipCallTimestamp > 5 * 60 * 1000) {
            clearPendingVoipCallInternal()
            return null
        }

        val result = data.toWritableMap()
        clearPendingVoipCallInternal()
        
        return result
    }

    /**
     * Clears any pending VoIP call data.
     */
    @ReactMethod
    override fun clearPendingVoipCall() {
        clearPendingVoipCallInternal()
    }
}
