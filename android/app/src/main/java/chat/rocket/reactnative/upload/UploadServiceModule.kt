package chat.rocket.reactnative.upload

import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class UploadServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "UploadService"

    @ReactMethod
    fun start(title: String, cancelLabel: String, percent: Int, promise: Promise) {
        try {
            ContextCompat.startForegroundService(reactApplicationContext, UploadForegroundService.intent(reactApplicationContext, title, cancelLabel, percent))
            promise.resolve(null)
        } catch (e: Exception) {
            Log.w(TAG, "Could not start the upload foreground service", e)
            promise.reject("E_UPLOAD_SERVICE_START", e)
        }
    }

    @ReactMethod
    fun updateProgress(percent: Int) = UploadForegroundService.updateProgress(reactApplicationContext, percent)

    @ReactMethod
    fun stop() = UploadForegroundService.stop(reactApplicationContext)

    companion object {
        private const val TAG = "UploadService"
    }
}
