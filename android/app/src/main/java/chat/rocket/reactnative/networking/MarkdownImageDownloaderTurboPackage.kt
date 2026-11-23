package chat.rocket.reactnative.networking

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class MarkdownImageDownloaderTurboPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        when (name) {
            NativeMarkdownImageDownloaderSpec.NAME -> MarkdownImageDownloaderModule(reactContext)
            else -> null
        }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
        mapOf(
            NativeMarkdownImageDownloaderSpec.NAME to ReactModuleInfo(
                NativeMarkdownImageDownloaderSpec.NAME,
                NativeMarkdownImageDownloaderSpec.NAME,
                false,
                false,
                false,
                true
            )
        )
    }
}
