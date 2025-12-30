package chat.rocket.reactnative
 
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash
import android.content.Intent
import android.content.res.Configuration
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
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)
    
    // Handle video conf action from notification
    intent?.let { handleVideoConfIntent(it) }
  }
  
  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    // Handle video conf action when activity is already running
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

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}