package chat.rocket.reactnative.privacycover

import android.app.Activity
import android.app.Application
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.content.ContextCompat

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.LifecycleState

import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.R
import chat.rocket.reactnative.networking.NativePrivacyCoverSpec

import java.util.concurrent.atomic.AtomicInteger

class PrivacyCoverModule(reactContext: ReactApplicationContext) :
    NativePrivacyCoverSpec(reactContext), Application.ActivityLifecycleCallbacks {

    private var enabled = false
    private val coverToken = AtomicInteger(0)
    private var releasedToken = 0
    private var isResumed = false
    private var flagSecureSet = false
    private var coverView: View? = null

    init {
        (reactContext.applicationContext as Application).registerActivityLifecycleCallbacks(this)
        isResumed = reactContext.lifecycleState == LifecycleState.RESUMED
    }

    override fun invalidate() {
        (reactApplicationContext.applicationContext as Application).unregisterActivityLifecycleCallbacks(this)
        super.invalidate()
    }

    override fun setEnabled(enabled: Boolean) {
        UiThreadUtil.runOnUiThread {
            this.enabled = enabled
            (reactApplicationContext.currentActivity as? MainActivity)?.let { applyRecentsScreenshot(it) }
        }
    }

    override fun getCoverToken(): Double = coverToken.get().toDouble()

    override fun releaseCover(token: Double) {
        UiThreadUtil.runOnUiThread {
            if (token.toInt() != coverToken.get()) {
                return@runOnUiThread
            }
            releasedToken = token.toInt()
            if (isResumed) {
                hideCover()
            }
        }
    }

    override fun onActivityPaused(activity: Activity) {
        if (activity !is MainActivity) return
        isResumed = false
        if (enabled && Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
            flagSecureSet = true
        }
    }

    override fun onActivityStopped(activity: Activity) {
        if (activity !is MainActivity) return
        val token = coverToken.incrementAndGet()
        if (enabled) {
            showCover(activity)
        } else {
            releasedToken = token
        }
    }

    override fun onActivityResumed(activity: Activity) {
        if (activity !is MainActivity) return
        isResumed = true
        applyRecentsScreenshot(activity)
        clearFlagSecure(activity)
        if (releasedToken == coverToken.get()) {
            hideCover()
        }
    }

    override fun onActivityDestroyed(activity: Activity) {
        if (activity !is MainActivity) return
        coverView = null
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

    override fun onActivityStarted(activity: Activity) = Unit

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

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
        if (coverView != null) return
        val decorView = activity.window.decorView as ViewGroup
        val cover = FrameLayout(activity).apply {
            setBackgroundColor(ContextCompat.getColor(activity, R.color.splashBackground))
            isClickable = true
            addView(
                ImageView(activity).apply { setImageResource(R.drawable.bootsplash_logo) },
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER
                )
            )
        }
        decorView.addView(cover, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        coverView = cover
    }

    private fun hideCover() {
        coverView?.let { (it.parent as? ViewGroup)?.removeView(it) }
        coverView = null
    }
}
