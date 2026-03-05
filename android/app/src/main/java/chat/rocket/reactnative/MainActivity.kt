package chat.rocket.reactnative

import android.os.Bundle
import android.content.Intent
import android.view.KeyEvent
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash
import chat.rocket.reactnative.notification.NotificationIntentHandler
import chat.rocket.reactnative.a11y.KeyboardA11yModule
import chat.rocket.reactnative.scroll.FocusUtils

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
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)

    // Handle notification intents
    intent?.let { NotificationIntentHandler.handleIntent(this, it) }
  }

  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)

    // Handle notification intents when activity is already running
    NotificationIntentHandler.handleIntent(this, intent)
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (KeyboardA11yModule.isEnabled()) {
      val current: View? = currentFocus
      if (current != null && FocusUtils.hasInvertedParent(current)) {
        if (event.action == KeyEvent.ACTION_DOWN) {
          val keyCode = event.keyCode
          val isShiftPressed = event.isShiftPressed
          val mapped = when (keyCode) {
            // Invert DPAD vertical arrows for inverted lists
            KeyEvent.KEYCODE_DPAD_DOWN -> KeyEvent.KEYCODE_DPAD_UP
            KeyEvent.KEYCODE_DPAD_UP -> KeyEvent.KEYCODE_DPAD_DOWN
            // Map Tab / Shift+Tab to vertical navigation as well
            KeyEvent.KEYCODE_TAB ->
              if (isShiftPressed) KeyEvent.KEYCODE_DPAD_UP else KeyEvent.KEYCODE_DPAD_DOWN
            else -> keyCode
          }
          if (mapped != keyCode) {
            val invertedEvent = KeyEvent(
              event.downTime,
              event.eventTime,
              event.action,
              mapped,
              event.repeatCount,
              event.metaState,
              event.deviceId,
              event.scanCode,
              event.flags,
              event.source
            )
            return super.dispatchKeyEvent(invertedEvent)
          }
        }
      }
    }
    return super.dispatchKeyEvent(event)
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}
