package chat.rocket.reactnative

import android.app.Application
import android.content.res.Configuration
import android.database.DatabaseErrorHandler
import android.database.DatabaseUtils
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
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

  private val sidecarSuffixesThenMain = listOf("-wal", "-shm", "-journal", "")

  private fun migrateLegacyExperimentalDatabases() {
    val dataDir = File(applicationInfo.dataDir)
    val legacySuffix = "-experimental.db.db"
    val serversLegacyName = "default$legacySuffix"
    if (!File(dataDir, serversLegacyName).exists()) {
      return
    }
    val dataDirFiles = dataDir.listFiles() ?: return
    val legacyNames = dataDirFiles
        .filter { it.isFile && it.name.endsWith(legacySuffix) }
        .map { it.name }
        .filter { it != serversLegacyName } + serversLegacyName
    for (name in legacyNames) {
      val target = File(dataDir, "${name.removeSuffix(legacySuffix)}.db.db")
      if (target.length() > 0) {
        val replaceable = if (name == serversLegacyName) isServersTableEmpty(target) else !hasSubscriptionsTable(target)
        if (!replaceable) {
          continue
        }
        discardDatabase(dataDir, target.name)
      }
      for (suffix in sidecarSuffixesThenMain) {
        val from = File(dataDir, name + suffix)
        val to = File(dataDir, target.name + suffix)
        if (from.exists() && !from.renameTo(to)) {
          throw IllegalStateException("Failed to migrate ${from.name} to ${to.name}")
        }
      }
    }
  }

  private fun openForProbe(database: File): SQLiteDatabase {
    val keepFileOnCorruption = DatabaseErrorHandler { }
    return SQLiteDatabase.openDatabase(database.path, null, SQLiteDatabase.OPEN_READONLY, keepFileOnCorruption)
  }

  private fun isServersTableEmpty(database: File): Boolean {
    return try {
      openForProbe(database).use { DatabaseUtils.queryNumEntries(it, "servers") == 0L }
    } catch (e: SQLiteException) {
      false
    }
  }

  private fun hasSubscriptionsTable(database: File): Boolean {
    return try {
      openForProbe(database).use {
        DatabaseUtils.queryNumEntries(it, "sqlite_master", "type = 'table' AND name = 'subscriptions'") > 0L
      }
    } catch (e: SQLiteException) {
      true
    }
  }

  private fun discardDatabase(dir: File, name: String) {
    for (suffix in sidecarSuffixesThenMain) {
      val file = File(dir, name + suffix)
      if (file.exists() && !file.delete()) {
        throw IllegalStateException("Failed to discard ${file.name}")
      }
    }
  }
}
