package chat.rocket.reactnative.privacycover

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import chat.rocket.reactnative.networking.NativePrivacyCoverSpec

class PrivacyCoverPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            NativePrivacyCoverSpec.NAME -> PrivacyCoverModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativePrivacyCoverSpec.NAME to ReactModuleInfo(
                    name = NativePrivacyCoverSpec.NAME,
                    className = NativePrivacyCoverSpec.NAME,
                    canOverrideExistingModule = false,
                    needsEagerInit = false,
                    isCxxModule = false,
                    isTurboModule = true
                )
            )
        }
    }
}
