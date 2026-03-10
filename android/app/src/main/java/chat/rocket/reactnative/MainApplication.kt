package chat.rocket.reactnative

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage;
import com.bugsnag.android.Bugsnag
import expo.modules.ApplicationLifecycleDispatcher
import chat.rocket.reactnative.networking.SSLPinningTurboPackage;
import chat.rocket.reactnative.storage.MMKVKeyManager;
import chat.rocket.reactnative.storage.SecureStoragePackage;
import chat.rocket.reactnative.notification.VideoConfTurboPackage
import chat.rocket.reactnative.notification.PushNotificationTurboPackage
import chat.rocket.reactnative.notification.CustomPushNotification
import chat.rocket.reactnative.scroll.InvertedScrollPackage
import android.app.Activity
import android.os.Bundle

/**
 * Main Application class.
 * 
 * NOTIFICATION ARCHITECTURE:
 * - JS layer uses expo-notifications for token registration and event handling
 * - Native layer uses RCFirebaseMessagingService + CustomPushNotification for:
 *   - FCM message handling
 *   - Notification display with MessagingStyle
 *   - E2E encrypted message decryption
 *   - Direct reply functionality
 *   - Message-id-only notification loading
 */
open class MainApplication : Application(), ReactApplication {

  // Track active activity count for immediate foreground/background detection
  private var activeActivityCount = 0

  // ActivityLifecycleCallbacks for immediate app state tracking
  private val activityLifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
    override fun onActivityStarted(activity: Activity) {
      activeActivityCount++
      if (activeActivityCount == 1) {
        // App moved from background to foreground
        CustomPushNotification.setAppInForeground(true)
      }
    }

    override fun onActivityStopped(activity: Activity) {
      activeActivityCount--
      if (activeActivityCount == 0) {
        // App moved from foreground to background
        CustomPushNotification.setAppInForeground(false)
      }
    }
  }

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(SSLPinningTurboPackage())
              add(WatermelonDBJSIPackage())
              add(VideoConfTurboPackage())
              add(PushNotificationTurboPackage())
              add(SecureStoragePackage())
              add(InvertedScrollPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    Bugsnag.start(this)
    
    // Initialize MMKV encryption - reads existing key or generates new one
    // Must run before React Native starts to avoid race conditions
    MMKVKeyManager.initialize(this)

    // Register ActivityLifecycleCallbacks for immediate foreground/background detection
    registerActivityLifecycleCallbacks(activityLifecycleCallbacks)

    // Load the native entry point for the New Architecture
    load()
    
		ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

	override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
