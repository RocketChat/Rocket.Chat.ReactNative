package chat.rocket.reactnative.notification

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
         * Stores VoIP call data for JS to retrieve.
         * Also emits an event if the app is running.
         */
        @JvmStatic
        fun storePendingVoipCall(context: Context, callId: String, callUUID: String, callerName: String, host: String, event: String) {
            val data = mapOf(
                "notificationType" to "voip",
                "callId" to callId,
                "callUUID" to callUUID,
                "callerName" to callerName,
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
                .putString("callerName", callerName)
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
