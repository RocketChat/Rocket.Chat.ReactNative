package chat.rocket.reactnative

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash
import android.content.Intent
import android.content.res.Configuration
import chat.rocket.reactnative.notification.NotificationIntentHandler
import chat.rocket.reactnative.notification.CustomPushNotification
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "RocketChatRN"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // ProcessLifecycleOwner observer for app foreground/background state tracking
  private val lifecycleObserver = object : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) {
      // App is in foreground
      CustomPushNotification.setAppInForeground(true)
    }

    override fun onStop(owner: LifecycleOwner) {
      // App is in background
      CustomPushNotification.setAppInForeground(false)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)

    // Register ProcessLifecycleOwner observer
    ProcessLifecycleOwner.get().lifecycle.addObserver(lifecycleObserver)

    // Handle notification intents
    intent?.let { NotificationIntentHandler.handleIntent(this, it) }
  }

  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)

    // Handle notification intents when activity is already running
    NotificationIntentHandler.handleIntent(this, intent)
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}