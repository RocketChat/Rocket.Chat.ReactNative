package chat.rocket.reactnative.conference

import chat.rocket.reactnative.networking.NativeConferenceCallAndroidSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class ConferenceCallModule(reactContext: ReactApplicationContext) : NativeConferenceCallAndroidSpec(reactContext) {

    override fun startConferenceCallService(promise: Promise) {
        try {
            ConferenceCallService.startService(reactApplicationContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("E_CONFERENCE_FGS_START", e.message, e)
        }
    }

    override fun stopConferenceCallService() {
        ConferenceCallService.stopService(reactApplicationContext)
    }
}
