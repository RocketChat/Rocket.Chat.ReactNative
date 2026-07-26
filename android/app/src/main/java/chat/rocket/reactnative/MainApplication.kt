package chat.rocket.reactnative

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
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

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(SSLPinningTurboPackage())
          add(WatermelonDBJSIPackage())
          add(VideoConfTurboPackage())
          add(PushNotificationTurboPackage())
          add(VoipTurboPackage())
          add(SecureStoragePackage())
          add(InvertedScrollPackage())
          add(ExternalInputPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
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
}
