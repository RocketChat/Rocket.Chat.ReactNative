package chat.rocket.reactnative.conference

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule

object ConferenceEvents {
    @JvmStatic
    fun emit(context: Context, name: String, payload: Any?): Boolean {
        val reactContext = (context.applicationContext as? ReactApplication)?.reactHost?.currentReactContext ?: return false
        if (!reactContext.hasActiveReactInstance()) {
            return false
        }
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(name, payload)
        return true
    }
}
