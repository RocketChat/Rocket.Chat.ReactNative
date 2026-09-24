package chat.rocket.reactnative

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage;
import com.bugsnag.android.Bugsnag
import expo.modules.ApplicationLifecycleDispatcher
import chat.rocket.reactnative.networking.SSLPinningTurboPackage;
import chat.rocket.reactnative.storage.MMKVKeyManager;
import chat.rocket.reactnative.storage.SecureStoragePackage;
import chat.rocket.reactnative.notification.VideoConfTurboPackage
import chat.rocket.reactnative.notification.PushNotificationTurboPackage
import chat.rocket.reactnative.VoipTurboPackage
import chat.rocket.reactnative.scroll.InvertedScrollPackage
import chat.rocket.reactnative.input.ExternalInputPackage
import chat.rocket.reactnative.biometric.BiometricEnrollmentPackage

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

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(SSLPinningTurboPackage())
              add(WatermelonDBJSIPackage())
              add(VideoConfTurboPackage())
              add(PushNotificationTurboPackage())
              add(VoipTurboPackage())
              add(SecureStoragePackage())
              add(InvertedScrollPackage())
              add(ExternalInputPackage())
              add(BiometricEnrollmentPackage())
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
    // Migrate pre-4.73 experimental databases before React Native boots (no db open yet).
    migrateLegacyExperimentalDatabases()

    Bugsnag.start(this)
    
    // Initialize MMKV encryption - reads existing key or generates new one
    // Must run before React Native starts to avoid race conditions
    MMKVKeyManager.initialize(this)

    // Load the native entry point for the New Architecture
    loadReactNative(this)
    
		ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

	override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }

  // Rename pre-4.73 `<name>-experimental.db` files to unified names when missing; never overwrites.
  private fun migrateLegacyExperimentalDatabases() {
    try {
      val dirs = listOfNotNull(filesDir?.parentFile, getDatabasePath("probe").parentFile)
      for (dir in dirs) {
        val files = dir.listFiles() ?: continue
        for (file in files) {
          if (!file.isFile || !file.name.contains("-experimental.db")) {
            continue
          }
          val target = java.io.File(dir, file.name.replace("-experimental.db", ".db"))
          if (target.exists()) {
            continue
          }
          file.renameTo(target)
        }
      }
    } catch (e: Exception) {
      // Migration must never break startup. Worst case the app starts with a fresh
      // database and the startup saga falls back to the logged-out flow.
    }
  }
}
