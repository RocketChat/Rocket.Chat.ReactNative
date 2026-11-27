package chat.rocket.reactnative.privacycover

import android.app.Activity
import android.app.Application
import android.app.Dialog
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil

import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.R
import chat.rocket.reactnative.networking.NativePrivacyCoverSpec

import java.util.concurrent.atomic.AtomicInteger

class PrivacyCoverModule(reactContext: ReactApplicationContext) :
    NativePrivacyCoverSpec(reactContext), Application.ActivityLifecycleCallbacks {

    private var enabled = false
    private var coverToken = 0
    private val activatedToken = AtomicInteger(0)
    private var releasedToken = 0
    private var flagSecureSet = false
    private var coverDialog: Dialog? = null
    private var contentHiddenFromAccessibility: View? = null

    init {
        (reactContext.applicationContext as Application).registerActivityLifecycleCallbacks(this)
    }

    override fun invalidate() {
        (reactApplicationContext.applicationContext as Application).unregisterActivityLifecycleCallbacks(this)
        UiThreadUtil.runOnUiThread {
            hideCover()
            (reactApplicationContext.currentActivity as? MainActivity)?.let { clearFlagSecure(it) }
        }
        super.invalidate()
    }

    override fun setEnabled(enabled: Boolean) {
        UiThreadUtil.runOnUiThread {
            this.enabled = enabled
            (reactApplicationContext.currentActivity as? MainActivity)?.let { applyRecentsScreenshot(it) }
        }
    }

    override fun getCoverToken(): Double = activatedToken.get().toDouble()

    override fun releaseCover(token: Double) {
        UiThreadUtil.runOnUiThread {
            if (token.toInt() != coverToken) {
                return@runOnUiThread
            }
            releasedToken = token.toInt()
            if (isMainActivityResumed()) {
                hideCover()
            }
        }
    }

    override fun onActivityPaused(activity: Activity) {
        if (activity !is MainActivity) return
        if (enabled && Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            flagSecureSet = true
        }
    }

    override fun onActivityStopped(activity: Activity) {
        if (activity !is MainActivity) return
        coverToken += 1
        if (enabled) {
            showCover(activity)
        } else {
            releasedToken = coverToken
        }
    }

    override fun onActivityResumed(activity: Activity) {
        if (activity !is MainActivity) return
        activatedToken.set(coverToken)
        applyRecentsScreenshot(activity)
        clearFlagSecure(activity)
        if (releasedToken == coverToken) {
            hideCover()
        } else {
            showCover(activity)
        }
    }

    override fun onActivityDestroyed(activity: Activity) {
        if (activity !is MainActivity) return
        coverDialog?.dismiss()
        coverDialog = null
        contentHiddenFromAccessibility = null
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

    override fun onActivityStarted(activity: Activity) = Unit

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

    private fun isMainActivityResumed(): Boolean {
        val activity = reactApplicationContext.currentActivity as? MainActivity ?: return false
        return activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)
    }

    private fun applyRecentsScreenshot(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.setRecentsScreenshotEnabled(!enabled)
        }
    }

    private fun clearFlagSecure(activity: Activity) {
        if (flagSecureSet) {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
            flagSecureSet = false
        }
    }

    private fun showCover(activity: Activity) {
        if (coverDialog != null || activity.isFinishing) return
        val background = ContextCompat.getColor(activity, R.color.splashBackground)
        val cover = FrameLayout(activity).apply {
            addView(
                ImageView(activity).apply { setImageResource(R.drawable.bootsplash_logo) },
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER
                )
            )
        }
        coverDialog = Dialog(activity, android.R.style.Theme_DeviceDefault_NoActionBar).apply {
            setContentView(cover)
            setCancelable(false)
            window?.apply {
                setBackgroundDrawable(ColorDrawable(background))
                setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                setWindowAnimations(0)
                clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
            }
            show()
        }
        contentHiddenFromAccessibility = activity.findViewById<View>(android.R.id.content)?.apply {
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        }
    }

    private fun hideCover() {
        coverDialog?.dismiss()
        coverDialog = null
        contentHiddenFromAccessibility?.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_AUTO
        contentHiddenFromAccessibility = null
    }
}
