package chat.rocket.reactnative.notification

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod

/**
 * Native module to expose video conference notification actions to JavaScript.
 * Used to retrieve pending video conf actions when the app opens.
 */
class VideoConfModule(reactContext: ReactApplicationContext) : NativeVideoConfSpec(reactContext) {

    companion object {
        private const val PREFS_NAME = "RocketChatPrefs"
        private const val KEY_VIDEO_CONF_ACTION = "videoConfAction"

        /**
         * Stores a video conference action.
         * Called from native code when user interacts with video conf notification.
         */
        @JvmStatic
        fun storePendingAction(context: Context, actionJson: String) {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_VIDEO_CONF_ACTION, actionJson)
                .apply()
        }
    }

    /**
     * Gets any pending video conference action.
     * Returns null if no pending action.
     */
    @ReactMethod
    override fun getPendingAction(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val action = prefs.getString(KEY_VIDEO_CONF_ACTION, null)

            // Clear the action after reading
            action?.let {
                prefs.edit().remove(KEY_VIDEO_CONF_ACTION).apply()
            }

            promise.resolve(action)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Clears any pending video conference action.
     */
    @ReactMethod
    override fun clearPendingAction() {
        try {
            reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .remove(KEY_VIDEO_CONF_ACTION)
                .apply()
        } catch (e: Exception) {
            // Ignore errors
        }
    }
}
