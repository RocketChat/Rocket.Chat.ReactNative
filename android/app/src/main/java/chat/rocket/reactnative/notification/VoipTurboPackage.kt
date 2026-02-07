package chat.rocket.reactnative.notification

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class VoipTurboPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            NativeVoipSpec.NAME -> VoipModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeVoipSpec.NAME to ReactModuleInfo(
                    NativeVoipSpec.NAME,
                    NativeVoipSpec.NAME,
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    false,  // isCxxModule
                    true    // isTurboModule
                )
            )
        }
    }
}
