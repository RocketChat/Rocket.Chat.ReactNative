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
        private const val PREFS_NAME = "VoipCallData"
        private const val EVENT_VOIP_CALL = "VoipCallAction"
        private const val EVENT_CALL_ANSWERED = "VoipCallAnswered"
        private const val EVENT_CALL_DECLINED = "VoipCallDeclined"
        private const val EVENT_INCOMING_CALL = "VoipIncomingCall"

        private var reactContextRef: WeakReference<ReactApplicationContext>? = null

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
         * Emits a call answered event to JavaScript.
         */
        @JvmStatic
        fun emitCallAnswered(callUUID: String) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_CALL_ANSWERED, callUUID)
                        Log.d(TAG, "Emitted call answered event to JS: $callUUID")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit call answered event", e)
            }
        }

        /**
         * Emits a call declined event to JavaScript.
         */
        @JvmStatic
        fun emitCallDeclined(callUUID: String) {
            try {
                reactContextRef?.get()?.let { context ->
                    if (context.hasActiveReactInstance()) {
                        context
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            .emit(EVENT_CALL_DECLINED, callUUID)
                        Log.d(TAG, "Emitted call declined event to JS: $callUUID")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to emit call declined event", e)
            }
        }

        /**
         * Clears pending VoIP call data from SharedPreferences.
         * Internal method that can be called from any context.
         */
        @JvmStatic
        internal fun clearPendingVoipCall(context: Context) {
            try {
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .edit()
                    .clear()
                    .apply()
                Log.d(TAG, "Cleared pending VoIP call data")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing pending VoIP call", e)
            }
        }

        /**
         * Cancels an incoming call notification and activity.
         */
        // @JvmStatic
        // fun cancelIncomingCall(callUUID: String) {
        //     try {
        //         val notificationId = callUUID.replace("-", "").hashCode()
        //         reactContextRef?.get()?.let { context ->
        //             VoipNotification.cancelById(context, notificationId)
        //             clearPendingVoipCall(context)
        //             Log.d(TAG, "Cancelled incoming call: $callUUID")
        //         }
        //     } catch (e: Exception) {
        //         Log.e(TAG, "Failed to cancel incoming call", e)
        //     }
        // }

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

            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString("pendingAction", jsonData)
                .putString("callId", callId)
                .putString("callUUID", callUUID)
                .putString("caller", caller)
                .putString("host", host)
                .putString("event", event)
                .putLong("timestamp", System.currentTimeMillis())
                .apply()

            Log.d(TAG, "Stored pending VoIP call: $callId")

            // Emit event if app is running
            emitVoipCallEvent(jsonData)
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
    override fun getPendingVoipCall(promise: Promise) {
        try {
            Log.d(TAG, "getPendingVoipCall")
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            
            // Check if data is stale (older than 5 minutes)
            val timestamp = prefs.getLong("timestamp", 0)
            if (System.currentTimeMillis() - timestamp > 5 * 60 * 1000) {
                Log.d(TAG, "Pending VoIP call data is stale, clearing")
                clearPendingVoipCallInternal()
                promise.resolve(null)
                return
            }

            val pendingAction = prefs.getString("pendingAction", null)
            if (pendingAction != null) {
                // Clear after reading
                clearPendingVoipCallInternal()
                Log.d(TAG, "Retrieved and cleared pending VoIP call")
            }

            promise.resolve(pendingAction)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting pending VoIP call", e)
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Clears any pending VoIP call data.
     */
    @ReactMethod
    override fun clearPendingVoipCall() {
        clearPendingVoipCallInternal()
    }

    private fun clearPendingVoipCallInternal() {
        try {
            reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .clear()
                .apply()
            Log.d(TAG, "Cleared pending VoIP call data")
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing pending VoIP call", e)
        }
    }
}
