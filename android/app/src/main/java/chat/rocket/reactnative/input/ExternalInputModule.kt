package chat.rocket.reactnative.input

import android.content.Context
import android.content.res.Configuration
import android.view.InputDevice
import android.view.View
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class ExternalInputModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ExternalInput"

    // The OS reports a hardware QWERTY keyboard as currently available. When this is
    // true Android suppresses auto-showing the soft IME on focus. Note this can be a
    // false positive: rugged handhelds (e.g. Zebra) expose hardware keys that make the
    // OS report a QWERTY keyboard even though there is no physical keyboard to type on.
    private fun hasHardwareKeyboardConfig(): Boolean {
        val config = reactApplicationContext.resources.configuration
        return config.keyboard == Configuration.KEYBOARD_QWERTY &&
                config.hardKeyboardHidden == Configuration.HARDKEYBOARDHIDDEN_NO
    }

    // A real, non-virtual alphabetic keyboard the user can actually type on (e.g. a
    // Bluetooth/USB keyboard). Zebra-style hardware keys report as non-alphabetic, so
    // this returns false for them while still returning true for genuine keyboards.
    private fun hasPhysicalAlphabeticKeyboard(): Boolean {
        return InputDevice.getDeviceIds().any { id ->
            val device = InputDevice.getDevice(id) ?: return@any false
            !device.isVirtual &&
                    device.keyboardType == InputDevice.KEYBOARD_TYPE_ALPHABETIC &&
                    (device.sources and InputDevice.SOURCE_KEYBOARD) == InputDevice.SOURCE_KEYBOARD
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isExternalKeyboardConnected(): Boolean =
        hasHardwareKeyboardConfig() && hasPhysicalAlphabeticKeyboard()

    // True only for the false-positive case: the OS reports a hardware keyboard (and so
    // suppresses the soft IME) but there is no real alphabetic keyboard. In that case we
    // must explicitly request the soft keyboard so text entry works.
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun shouldForceSoftKeyboard(): Boolean =
        hasHardwareKeyboardConfig() && !hasPhysicalAlphabeticKeyboard()

    @ReactMethod
    fun showSoftInput() {
        UiThreadUtil.runOnUiThread {
            val activity = reactApplicationContext.currentActivity ?: return@runOnUiThread
            val view: View = activity.currentFocus ?: activity.window?.decorView?.findFocus() ?: return@runOnUiThread
            val imm = activity.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager ?: return@runOnUiThread

            // Flag 0 (not SHOW_IMPLICIT): when the OS believes a hardware keyboard is
            // present it ignores implicit requests, which is exactly the case we need to
            // override here.
            imm.showSoftInput(view, 0)
        }
    }
}
