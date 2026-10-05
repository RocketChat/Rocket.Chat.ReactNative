package chat.rocket.reactnative.upload

import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class UploadServiceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    override fun getName(): String = "UploadService"

    @ReactMethod
    fun start(title: String, cancelLabel: String) {
        try {
            ContextCompat.startForegroundService(context, UploadForegroundService.intent(context, title, cancelLabel))
        } catch (e: Exception) {
            Log.w("UploadService", "Could not start the upload foreground service", e)
        }
    }

    @ReactMethod
    fun updateProgress(percent: Int) = UploadForegroundService.updateProgress(context, percent.coerceIn(0, 100))

    @ReactMethod
    fun stop() {
        context.stopService(UploadForegroundService.intent(context))
    }
}
