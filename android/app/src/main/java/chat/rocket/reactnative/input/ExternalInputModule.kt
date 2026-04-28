package chat.rocket.reactnative.input

import android.content.res.Configuration
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ExternalInputModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ExternalInput"

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isExternalKeyboardConnected(): Boolean {
        val config = reactApplicationContext.resources.configuration
        return config.keyboard == Configuration.KEYBOARD_QWERTY &&
                config.hardKeyboardHidden == Configuration.HARDKEYBOARDHIDDEN_NO
    }
}
