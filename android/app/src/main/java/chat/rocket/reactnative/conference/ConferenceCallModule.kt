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

    override fun updateConferenceCallNotification(micEnabled: Boolean, muteLabel: String, unmuteLabel: String, leaveLabel: String) {
        ConferenceCallService.updateControls(reactApplicationContext, micEnabled, muteLabel, unmuteLabel, leaveLabel)
    }

    override fun consumeOpenCallRequest(promise: Promise) {
        promise.resolve(ConferenceCallOpenRequest.consume())
    }

    override fun startMicLevelMonitor(promise: Promise) {
        promise.resolve(ConferenceMicLevelMonitor.start(reactApplicationContext))
    }

    override fun stopMicLevelMonitor(promise: Promise) {
        ConferenceMicLevelMonitor.stop()
        promise.resolve(null)
    }

    override fun invalidate() {
        ConferenceMicLevelMonitor.stop()
        super.invalidate()
    }

    override fun setPictureInPictureEnabled(enabled: Boolean) {
        ConferencePictureInPicture.setEnabled(reactApplicationContext.currentActivity, enabled)
    }

    override fun enterPictureInPicture(promise: Promise) {
        promise.resolve(ConferencePictureInPicture.enter(reactApplicationContext.currentActivity))
    }
}
