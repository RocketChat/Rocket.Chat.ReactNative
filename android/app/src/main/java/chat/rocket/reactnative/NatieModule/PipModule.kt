package chat.rocket.reactnative.NatieModule

import android.app.PictureInPictureParams
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.Rational
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil


class PipModule internal constructor(context: ReactApplicationContext?) :
    ReactContextBaseJavaModule(context) {
    private val aspectRatio = Rational(3, 4)

    override fun getName(): String {
        return "PipModule"
    }

    @ReactMethod
    fun EnterPipMode() {
        try {
            UiThreadUtil.runOnUiThread {
                val activity = currentActivity ?: return@runOnUiThread
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (activity.isInPictureInPictureMode) {
                        return@runOnUiThread
                    }
                    try {
                        val params = PictureInPictureParams.Builder()
                            .setAspectRatio(this.aspectRatio)
                            .build()
                        activity.enterPictureInPictureMode(params)
                    } catch (e: IllegalStateException) {
                        // Activity is not resumed, try again after a delay
                        Handler(Looper.getMainLooper()).postDelayed({
                            try {
                                val params = PictureInPictureParams.Builder()
                                    .setAspectRatio(this.aspectRatio)
                                    .build()
                                activity.enterPictureInPictureMode(params)
                            } catch (e: Exception) {
                                Log.e("PipModule", "Retry failed: ${e.message}")
                            }
                        }, 300) // 300ms delay
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("PipModule", "Error entering PiP: ${e.message}")
            e.printStackTrace()
        }
    }
}

