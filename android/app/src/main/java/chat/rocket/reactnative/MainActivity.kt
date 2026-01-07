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
import chat.rocket.reactnative.notification.PushNotificationModule
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
    
    // Handle regular notification tap (non-video conf)
    intent?.let { handleNotificationIntent(it) }
  }
  
  public override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    
    // Handle video conf action when activity is already running
    handleVideoConfIntent(intent)
    
    // Handle regular notification tap when activity is already running
    handleNotificationIntent(intent)
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
      
      VideoConfModule.storePendingAction(this, jsonData)
      
      // Clear the video conf flag to prevent re-processing
      intent.removeExtra("videoConfAction")
    }
  }
  
  /**
   * Handles regular notification tap (non-video conf).
   * Extracts Intent extras and stores them for React Native to pick up.
   */
  private fun handleNotificationIntent(intent: Intent) {
    // Skip if this is a video conf action (handled separately)
    if (intent.getBooleanExtra("videoConfAction", false)) {
      return
    }
    
    val extras = intent.extras ?: return
    
    // Check if this Intent has notification data (ejson)
    val ejson = extras.getString("ejson")
    if (ejson.isNullOrEmpty()) {
      return
    }
    
    try {
      // Extract all notification data from Intent extras
      // Only include serializable types to avoid JSON serialization errors
      val notificationData = mutableMapOf<String, Any?>()
      
      // Copy all extras to the notification data map, filtering out non-serializable types
      extras.keySet().forEach { key ->
        try {
          when (val value = extras.get(key)) {
            is String -> notificationData[key] = value
            is Int -> notificationData[key] = value
            is Boolean -> notificationData[key] = value
            is Long -> notificationData[key] = value
            is Float -> notificationData[key] = value
            is Double -> notificationData[key] = value
            is Byte -> notificationData[key] = value
            is Char -> notificationData[key] = value
            is Short -> notificationData[key] = value
            // Skip complex types that can't be serialized (Bundle, Parcelable, etc.)
            is Bundle -> {
              // Skip Bundle objects - they're not JSON serializable
              android.util.Log.w("RocketChat.MainActivity", "Skipping Bundle extra: $key")
            }
            null -> {
              // Skip null values
            }
            else -> {
              // For other types, try to convert to String only if it's a simple type
              // Skip complex objects that might not serialize properly
              val stringValue = value.toString()
              // Only include if it's a reasonable string representation (not object reference)
              if (!stringValue.startsWith("android.") && !stringValue.contains("@")) {
                notificationData[key] = stringValue
              } else {
                android.util.Log.w("RocketChat.MainActivity", "Skipping non-serializable extra: $key (type: ${value.javaClass.simpleName})")
              }
            }
          }
        } catch (e: Exception) {
          android.util.Log.w("RocketChat.MainActivity", "Error processing extra $key: ${e.message}")
        }
      }
      
      // Convert to JSON and store for React Native
      val gson = GsonBuilder().create()
      val jsonData = gson.toJson(notificationData)
      
      // Store notification data with error handling
      try {
        PushNotificationModule.storePendingNotification(this, jsonData)
      } catch (e: Exception) {
        android.util.Log.e("RocketChat.MainActivity", "Failed to store pending notification: ${e.message}", e)
      }
    } catch (e: Exception) {
      android.util.Log.e("RocketChat.MainActivity", "Error handling notification intent: ${e.message}", e)
    }
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}