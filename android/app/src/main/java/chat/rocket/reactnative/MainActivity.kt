package chat.rocket.reactnative

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import android.os.Build
import android.os.PersistableBundle
import com.zoontek.rnbootsplash.RNBootSplash
import android.content.Intent
import android.content.res.Configuration
import chat.rocket.reactnative.notification.NotificationIntentHandler
import androidx.core.net.toUri

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

  override fun onCreate(savedInstanceState: Bundle?) {
    // quick actions handling
    intent?.let {
      embedQuickActionIntoLinking(it)
    }

    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)

    // Handle notification intents
    intent?.let { NotificationIntentHandler.handleIntent(this, it) }
  }

  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)

    // quick actions handling
    embedQuickActionIntoLinking(intent)

    // Handle notification intents when activity is already running
    NotificationIntentHandler.handleIntent(this, intent)
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }

  private fun embedQuickActionIntoLinking(intent: Intent) {
    val action = intent.action ?: return

    android.util.Log.d("RocketChat.QuickAction", "Original action: $action")

    // Handle Expo quick actions
    if (action == "expo.modules.quickactions.SHORTCUT") {
      // Get the PersistableBundle
      val shortcutData: PersistableBundle? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.getParcelableExtra(
            "shortcut_data",
            PersistableBundle::class.java
          )
        } else {
          @Suppress("DEPRECATION")
          intent.getParcelableExtra("shortcut_data")
        }

      if (shortcutData != null) {
        /**
         * Log all keys in the bundle
         * kept for debugging later
         */
        /*
        android.util.Log.d("RocketChat.QuickAction", "=== Shortcut Data Bundle ===")
            for (key in shortcutData.keySet()) {
              val value = shortcutData.get(key)
              android.util.Log.d("RocketChat.QuickAction", "Key: $key, Value: $value")
            }
         android.util.Log.d("RocketChat.QuickAction", "============================")
         */

        // Try to get the shortcut ID from various possible keys
        val shortcutId = shortcutData.getString("id")
          ?: shortcutData.getString("shortcutId")
          ?: shortcutData.getString("android.intent.extra.shortcut.ID")

        if (shortcutId != null) {
          val uri = "rocketchat://quick-action/$shortcutId".toUri()

          android.util.Log.d("RocketChat.QuickAction", "Converted to: $uri")

          intent.action = Intent.ACTION_VIEW
          intent.data = uri
          setIntent(intent)

          android.util.Log.d("RocketChat.QuickAction", "Intent set with data: ${getIntent().data}")
        }
      } else {
        android.util.Log.d("RocketChat.QuickAction", "No shortcut_data bundle found")
      }
      return
    }

    // skip for non-Expo quick actions (app launches)
    if (!action.startsWith("chat.rocket.reactnative.")) {
      android.util.Log.d("RocketChat.QuickAction", "Not a quick action, skipping")
      return
    }

    val quickAction = action
      .removePrefix("chat.rocket.reactnative.")
      .lowercase()
      .replace('_', '-')

    val uri = "rocketchat://quick-action/$quickAction".toUri()

    intent.action = Intent.ACTION_VIEW
    intent.data = uri
    setIntent(intent)

    android.util.Log.d("RocketChat.QuickAction", "Intent set with data: ${getIntent().data}")
  }
}