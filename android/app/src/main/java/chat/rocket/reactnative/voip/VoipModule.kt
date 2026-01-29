package chat.rocket.reactnative.voip

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.GsonBuilder
import java.lang.ref.WeakReference

/**
 * Native module to expose VoIP call data to JavaScript.
 * Used to retrieve pending VoIP call data when the app opens from a VoIP notification.
 */
class VoipModule(reactContext: ReactApplicationContext) : NativeVoipSpec(reactContext) {

    companion object {
        private const val TAG = "RocketChat.VoipModule"
        private const val EVENT_VOIP_CALL = "VoipCallAction"

        private var reactContextRef: WeakReference<ReactApplicationContext>? = null
        private var pendingVoipCallData: String? = null
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
        fun emitVoipCallEvent(callDataJson: String) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_VOIP_CALL, callDataJson)
                        Log.d(TAG, "Emitted VoIP call event to JS")
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
        fun storePendingVoipCall(context: Context, callId: String, callUUID: String, caller: String, host: String, event: String) {
            // TODO: use VoipPayload
            val data = mapOf(
                "notificationType" to "voip",
                "callId" to callId,
                "callUUID" to callUUID,
                "caller" to caller,
                "host" to host,
                "event" to event
            )

            val gson = GsonBuilder().create()
            val jsonData = gson.toJson(data)

            // Store in local variable instead of SharedPreferences
            pendingVoipCallData = jsonData
            pendingVoipCallTimestamp = System.currentTimeMillis()

            Log.d(TAG, "Stored pending VoIP call: $callId")

            // Emit event if app is running
            emitVoipCallEvent(jsonData)
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
    override fun getPendingVoipCall(): String? {
        return try {
            // Check if data is stale (older than 5 minutes)
            if (System.currentTimeMillis() - pendingVoipCallTimestamp > 5 * 60 * 1000) {
                clearPendingVoipCallInternal()
                null
            } else {
                if (pendingVoipCallData != null) {
                    clearPendingVoipCallInternal()
                }
                pendingVoipCallData
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting pending VoIP call", e)
            null
        }
    }

    /**
     * Clears any pending VoIP call data.
     */
    @ReactMethod
    override fun clearPendingVoipCall() {
        clearPendingVoipCallInternal()
    }
}
