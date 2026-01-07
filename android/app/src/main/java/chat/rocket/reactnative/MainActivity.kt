package chat.rocket.reactnative

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash
import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import chat.rocket.reactnative.notification.VideoConfModule
import chat.rocket.reactnative.notification.VideoConfNotification
import com.google.gson.GsonBuilder

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
    intent?.let {
      embedQuickActionIntoLinking(it)
    }

    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)

    // Handle video conf action from notification
    intent?.let {
      handleVideoConfIntent(it)
    }
  }

  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    // Handle video conf action when activity is already running
    embedQuickActionIntoLinking(intent)
    handleVideoConfIntent(intent)
  }

  private fun handleVideoConfIntent(intent: Intent) {
    if (intent.getBooleanExtra("videoConfAction", false)) {
      val notificationId = intent.getIntExtra("notificationId", 0)
      val event = intent.getStringExtra("event") ?: return
      val rid = intent.getStringExtra("rid") ?: ""
      val callerId = intent.getStringExtra("callerId") ?: ""
      val callerName = intent.getStringExtra("callerName") ?: ""
      val host = intent.getStringExtra("host") ?: ""
      val callId = intent.getStringExtra("callId") ?: ""

      android.util.Log.d("RocketChat.MainActivity", "Handling video conf intent - event: $event, rid: $rid, host: $host, callId: $callId")

      // Cancel the notification
      if (notificationId != 0) {
        VideoConfNotification.cancelById(this, notificationId)
      }

      // Store action for JS to pick up - include all required fields
      val data = mapOf(
        "notificationType" to "videoconf",
        "rid" to rid,
        "event" to event,
        "host" to host,
        "callId" to callId,
        "caller" to mapOf(
          "_id" to callerId,
          "name" to callerName
        )
      )

      val gson = GsonBuilder().create()
      val jsonData = gson.toJson(data)

      android.util.Log.d("RocketChat.MainActivity", "Storing video conf action: $jsonData")

      VideoConfModule.storePendingAction(this, jsonData)

      // Clear the video conf flag to prevent re-processing
      intent.removeExtra("videoConfAction")
    }
  }

  private fun embedQuickActionIntoLinking(intent: Intent) {
    val action = intent.action ?: return

    android.util.Log.d("RocketChat.QuickAction", "Original action: $action")

    // Handle Expo quick actions
    if (action == "expo.modules.quickactions.SHORTCUT") {
      // Get the PersistableBundle
      val shortcutData = intent.getParcelableExtra<android.os.PersistableBundle>("shortcut_data")

      if (shortcutData != null) {
        // Log all keys in the bundle
        // kept for debugging later
        // android.util.Log.d("RocketChat.QuickAction", "=== Shortcut Data Bundle ===")
        // for (key in shortcutData.keySet()) {
        //    val value = shortcutData.get(key)
        //    android.util.Log.d("RocketChat.QuickAction", "Key: $key, Value: $value")
        //  }
        //  android.util.Log.d("RocketChat.QuickAction", "============================")

        // Try to get the shortcut ID from various possible keys
        val shortcutId = shortcutData.getString("id")
          ?: shortcutData.getString("shortcutId")
          ?: shortcutData.getString("android.intent.extra.shortcut.ID")

        android.util.Log.d("RocketChat.QuickAction", "Expo shortcut ID: $shortcutId")

        if (shortcutId != null) {
          val uri = Uri.parse("rocketchat://quick-action/$shortcutId")

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

    // Handle non-Expo quick actions
    // we does not need this as currently we are setting it from expo only
    // TODO: remove later
    if (!action.startsWith("chat.rocket.reactnative.")) {
      android.util.Log.d("RocketChat.QuickAction", "Not a quick action, skipping")
      return
    }

    val quickAction = action
      .removePrefix("chat.rocket.reactnative.")
      .lowercase()
      .replace('_', '-')

    val uri = Uri.parse("rocketchat://quick-action/$quickAction")

    android.util.Log.d("RocketChat.QuickAction", "Converted to: $uri")

    intent.action = Intent.ACTION_VIEW
    intent.data = uri
    setIntent(intent)

    android.util.Log.d("RocketChat.QuickAction", "Intent set with data: ${getIntent().data}")
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}