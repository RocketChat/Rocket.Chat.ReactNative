package chat.rocket.reactnative.voip

import android.app.Application
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import org.mockito.Mockito

/**
 * Minimal [ReactApplicationContext] for JVM unit tests (RN 0.81 [com.facebook.react.bridge.ReactContext] is abstract).
 */
class StubReactApplicationContext(
    application: Application,
    private val activeReactInstance: Boolean = false
) : ReactApplicationContext(application) {

    private val catalyst: CatalystInstance = Mockito.mock(CatalystInstance::class.java)

    override fun <T : JavaScriptModule?> getJSModule(jsInterface: Class<T>): T {
        val mockJs = Mockito.mock(jsInterface)
        @Suppress("UNCHECKED_CAST")
        return mockJs as T
    }

    override fun <T : NativeModule?> hasNativeModule(nativeModuleInterface: Class<T>): Boolean = false

    override fun getNativeModules(): Collection<NativeModule> = emptyList()

    override fun <T : NativeModule?> getNativeModule(nativeModuleInterface: Class<T>): T? = null

    override fun getNativeModule(moduleName: String): NativeModule? = null

    override fun getCatalystInstance(): CatalystInstance {
        check(activeReactInstance) { "No catalyst when React instance is inactive" }
        return catalyst
    }

    override fun hasActiveCatalystInstance(): Boolean = activeReactInstance

    override fun hasActiveReactInstance(): Boolean = activeReactInstance

    override fun hasCatalystInstance(): Boolean = activeReactInstance

    override fun hasReactInstance(): Boolean = activeReactInstance

    override fun destroy() {}

    override fun handleException(e: Exception) {
        throw AssertionError("Unexpected exception in stub context", e)
    }

    override fun isBridgeless(): Boolean = false

    override fun getJavaScriptContextHolder(): JavaScriptContextHolder? = null

    override fun getJSCallInvokerHolder(): CallInvokerHolder? = null

    override fun getFabricUIManager(): UIManager? = null

    override fun getSourceURL(): String? = null

    override fun registerSegment(segmentId: Int, path: String?, callback: Callback?) {}
}
