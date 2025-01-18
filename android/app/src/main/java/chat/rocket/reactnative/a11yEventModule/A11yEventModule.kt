package chat.rocket.reactnative.a11yeventmodule

import android.app.Activity
import android.os.Build
import android.util.Log
import android.view.View
import androidx.annotation.NonNull
import android.content.Context
import android.view.accessibility.AccessibilityManager

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UIManager
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.common.ViewUtil


class A11yEventModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "A11yEvent"

    private val FABRIC = 2 // Define FABRIC constant

    @ReactMethod
    fun isTalkbackEnabled(promise: Promise) {
        try {
            val manager = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
            promise.resolve(manager.isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check TalkBack status", e)
        }
    }

    @ReactMethod
    fun setA11yOrder(@NonNull reactTags: ReadableArray, nativeTag: Double?) {
        val length = reactTags.size()
        if (length < 2) return

        val activity: Activity? = currentActivity
        if (activity == null) {
            return
        }

        activity.runOnUiThread {
            var manager: UIManager? = null
            try {
                val uiManagerType = ViewUtil.getUIManagerType(reactTags.getInt(0))
                manager = if (uiManagerType == com.facebook.react.uimanager.common.UIManagerType.FABRIC) {
                    UIManagerHelper.getUIManager(reactApplicationContext, uiManagerType)
                } else {
                    reactApplicationContext.getNativeModule(UIManagerModule::class.java)
                }

                val views = ArrayList<View>()
                for (i in 0 until length) {
                    try {
                        views.add(manager!!.resolveView(reactTags.getInt(i)))
                    } catch (error: IllegalViewOperationException) {
                        Log.e("ERROR", error.message ?: "Unknown error")
                    }
                }

                for (i in 0 until views.size - 1) {
                    val currentView = views[i]
                    val nextView = views[i + 1]
                    currentView.nextFocusForwardId = nextView.id
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                        currentView.accessibilityTraversalBefore = nextView.id
                    }
                }
            } catch (error: IllegalViewOperationException) {
                Log.e("ORDER_FOCUS_ERROR", error.message ?: "Unknown error")
            }
        }
    }
}
