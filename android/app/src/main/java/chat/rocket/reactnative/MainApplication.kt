package chat.rocket.reactnative

import android.app.Application
import android.content.res.Configuration
import android.database.DatabaseErrorHandler
import android.database.DatabaseUtils
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
import android.system.ErrnoException
import android.system.Os
import android.util.Log
import java.io.File
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
    Bugsnag.start(this)
    
    migrateLegacyExperimentalDatabases()

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

  private fun migrateLegacyExperimentalDatabases() {
    val dataDir = File(applicationInfo.dataDir)
    val legacySuffix = "-experimental.db.db"
    val serversLegacy = File(dataDir, "default$legacySuffix")
    if (!serversLegacy.isFile) {
      return
    }
    val dataDirFiles = dataDir.listFiles() ?: return
    val otherLegacy = dataDirFiles.filter { it.isFile && it.name.endsWith(legacySuffix) && it != serversLegacy }
    var targetKept = false
    for (legacy in otherLegacy + serversLegacy) {
      val isServersDatabase = legacy == serversLegacy
      val target = File(legacy.path.removeSuffix(legacySuffix) + ".db.db")
      val targetCollidesWithServersLegacy = target == serversLegacy
      if (targetCollidesWithServersLegacy || (isServersDatabase && targetKept)) {
        continue
      }
      if (target.length() > 0) {
        if (!isReplaceable(target, isServersDatabase)) {
          targetKept = true
          continue
        }
        discardDatabase(target)
      }
      moveDatabase(legacy, target)
    }
  }

  private fun sidecarsThenMain(main: File) = listOf("-wal", "-shm", "-journal", "").map { File(main.path + it) }

  private fun moveDatabase(from: File, to: File) {
    for ((source, destination) in sidecarsThenMain(from).zip(sidecarsThenMain(to))) {
      if (source.exists()) {
        try {
          Os.rename(source.path, destination.path)
        } catch (e: ErrnoException) {
          throw IllegalStateException("Failed to migrate ${source.name} to ${destination.name}", e)
        }
      }
    }
  }

  private fun discardDatabase(main: File) {
    for (file in sidecarsThenMain(main)) {
      if (file.exists()) {
        try {
          Os.remove(file.path)
        } catch (e: ErrnoException) {
          throw IllegalStateException("Failed to discard ${file.name}", e)
        }
      }
    }
  }

  private fun isReplaceable(target: File, isServersDatabase: Boolean): Boolean {
    val keepFileOnCorruption = DatabaseErrorHandler { }
    return try {
      SQLiteDatabase.openDatabase(target.path, null, SQLiteDatabase.OPEN_READONLY, keepFileOnCorruption).use {
        if (isServersDatabase) {
          DatabaseUtils.queryNumEntries(it, "servers") == 0L
        } else {
          DatabaseUtils.queryNumEntries(it, "sqlite_master", "type = 'table' AND name = 'subscriptions'") == 0L
        }
      }
    } catch (e: SQLiteException) {
      Log.w("MainApplication", "Legacy database probe failed", e)
      false
    }
  }
}
