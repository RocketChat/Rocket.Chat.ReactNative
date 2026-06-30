package chat.rocket.reactnative.biometric

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import chat.rocket.reactnative.networking.NativeBiometricEnrollmentSpec

class BiometricEnrollmentPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            NativeBiometricEnrollmentSpec.NAME -> BiometricEnrollmentModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeBiometricEnrollmentSpec.NAME to ReactModuleInfo(
                    NativeBiometricEnrollmentSpec.NAME,
                    NativeBiometricEnrollmentSpec.NAME,
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    false,  // isCxxModule
                    true    // isTurboModule
                )
            )
        }
    }
}
