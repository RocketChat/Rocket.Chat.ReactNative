package chat.rocket.reactnative
 
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash
import android.content.Intent;
import android.content.res.Configuration;
 
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
    RNBootSplash.init(this)
    super.onCreate(null)
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}