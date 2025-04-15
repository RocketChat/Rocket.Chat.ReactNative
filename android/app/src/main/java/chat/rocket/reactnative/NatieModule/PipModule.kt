package chat.rocket.reactnative.NatieModule

import android.app.PictureInPictureParams
import android.os.Build
import android.util.Rational
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod


class PipModule internal constructor(context: ReactApplicationContext?) :
    ReactContextBaseJavaModule(context) {
    private val aspectRatio = Rational(3, 4)

    override fun getName(): String {
        return "PipModule"
    }

    @ReactMethod
    fun EnterPipMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(this.aspectRatio)
                .build()
            currentActivity!!.enterPictureInPictureMode(params)
        }
    }
}