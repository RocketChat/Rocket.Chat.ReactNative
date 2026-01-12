package chat.rocket.reactnative.notification

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * React Native TurboModule package for video conference notification module.
 */
class VideoConfTurboPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeVideoConfSpec.NAME) {
            VideoConfModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeVideoConfSpec.NAME to ReactModuleInfo(
                    NativeVideoConfSpec.NAME,
                    NativeVideoConfSpec.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // hasConstants
                    false, // isCxxModule
                    true   // isTurboModule
                )
            )
        }
    }
}
