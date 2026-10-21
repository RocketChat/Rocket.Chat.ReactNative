package chat.rocket.reactnative.conference

import chat.rocket.reactnative.networking.NativeConferenceCallAndroidSpec
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class ConferenceCallTurboPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeConferenceCallAndroidSpec.NAME) {
            ConferenceCallModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeConferenceCallAndroidSpec.NAME to ReactModuleInfo(
                    NativeConferenceCallAndroidSpec.NAME,
                    NativeConferenceCallAndroidSpec.NAME,
                    false,
                    false,
                    false,
                    false,
                    true
                )
            )
        }
    }
}
