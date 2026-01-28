package chat.rocket.reactnative.voip

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.app.NotificationCompat
import android.content.ComponentName
import android.net.Uri
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.utils.CallIdUUID

/**
 * Handles VoIP call notifications using Android's Telecom framework via CallKeep.
 * Displays incoming call UI through the system's phone app / telecom service.
 *
 * When CallKeep is available (app running), it uses the native telecom call UI.
 * When CallKeep is not available (app killed), it shows a high-priority notification
 * similar to VideoConfNotification.
 */
class VoipNotification(private val context: Context) {

    companion object {
        private const val TAG = "RocketChat.VoIP"

        const val CHANNEL_ID = "voip-call"
        const val CHANNEL_NAME = "VoIP Calls"

        const val ACTION_ACCEPT = "chat.rocket.reactnative.ACTION_VOIP_ACCEPT"
        const val ACTION_DECLINE = "chat.rocket.reactnative.ACTION_VOIP_DECLINE"

        // react-native-callkeep's ConnectionService class name
        private const val CALLKEEP_CONNECTION_SERVICE_CLASS = "io.wazo.callkeep.VoiceConnectionService"

        /**
         * Static method to clear stored call data from any context.
         */
        @JvmStatic
        fun clearStoredCallData(context: Context) {
            VoipModule.clearPendingVoipCall(context)
        }

        /**
         * Cancels a VoIP notification by ID.
         */
        @JvmStatic
        fun cancelById(context: Context, notificationId: Int) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.cancel(notificationId)
            Log.d(TAG, "VoIP notification cancelled with ID: $notificationId")
        }

        /**
         * Handles decline action for VoIP call.
         * Logs the decline action and clears stored call data.
         */
        @JvmStatic
        fun handleDeclineAction(context: Context, callUUID: String?) {
            Log.d(TAG, "Decline action triggered for callUUID: $callUUID")
            // Clear stored call data
            VoipModule.clearPendingVoipCall(context)
        }
    }

    /**
     * BroadcastReceiver to handle decline actions from notification.
     */
    class DeclineReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val callUUID = intent.getStringExtra("callUUID")
            VoipNotification.handleDeclineAction(context, callUUID)
        }
    }

    private val notificationManager: NotificationManager? =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    init {
        createNotificationChannel()
    }

    /**
     * Creates the notification channel for VoIP calls with high importance and ringtone sound.
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming VoIP calls"
                enableLights(true)
                enableVibration(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC

                // Set ringtone sound
                val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build()
                setSound(ringtoneUri, audioAttributes)
            }

            notificationManager?.createNotificationChannel(channel)
        }
    }

    /**
     * Displays an incoming VoIP call using full-screen intent for locked devices
     * and heads-up notification for unlocked devices.
     *
     * @param bundle The notification data bundle
     * @param voipPayload The VoIP payload containing call information
     */
    fun showIncomingCall(bundle: Bundle, voipPayload: VoipPayload) {
        val callId = voipPayload.callId
        if (callId.isNullOrEmpty()) {
            Log.w(TAG, "Cannot show VoIP call: callId is missing")
            return
        }

        // Get caller information - simplified since VoipPayload has caller as a string
        val callerName = voipPayload.caller ?: "Unknown"

        // TODO: remove this when it comes from the server
        val callUUID = CallIdUUID.generateUUIDv5(callId)

        Log.d(TAG, "Showing incoming VoIP call - callId: $callId, callUUID: $callUUID, caller: $callerName")

        // CRITICAL: Register call with TelecomManager FIRST (required for audio focus, Bluetooth, priority, FSI exemption)
        // This triggers react-native-callkeep's ConnectionService
        registerCallWithTelecomManager(callUUID, callerName)

        // Show notification with full-screen intent
        showIncomingCallNotification(bundle, voipPayload, callUUID, callerName)
    }

    /**
     * Registers the incoming call with TelecomManager using react-native-callkeep's ConnectionService.
     * This is REQUIRED for:
     * 1. Audio focus (pauses media apps)
     * 2. Bluetooth headset support
     * 3. Higher process priority
     * 4. FSI exemption on Play Store
     */
    private fun registerCallWithTelecomManager(callUUID: String, callerName: String) {
        try {
            // Validate inputs
            if (callUUID.isNullOrEmpty()) {
                Log.e(TAG, "Cannot register call with TelecomManager: callUUID is null or empty")
                return
            }

            val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                ?: run {
                    Log.w(TAG, "TelecomManager not available")
                    return
                }

            // Get react-native-callkeep's PhoneAccountHandle
            val componentName = ComponentName(context.packageName, CALLKEEP_CONNECTION_SERVICE_CLASS)
            // react-native-callkeep typically uses the app package name as the account ID
            val phoneAccountHandle = PhoneAccountHandle(componentName, context.packageName)

            // Check if PhoneAccount is registered
            val phoneAccount = telecomManager.getPhoneAccount(phoneAccountHandle)
            if (phoneAccount == null) {
                Log.w(TAG, "PhoneAccount not registered by react-native-callkeep yet. Call may not have full OS integration.")
                return
            }

            // Create extras for the incoming call
            // react-native-callkeep's VoiceConnectionService expects EXTRA_CALL_UUID constant
            // which is defined as "EXTRA_CALL_UUID" (not "callUUID")
            val extras = Bundle().apply {
                val callerUri = Uri.fromParts(PhoneAccount.SCHEME_TEL, callerName, null)
                putParcelable(TelecomManager.EXTRA_INCOMING_CALL_ADDRESS, callerUri)
                // react-native-callkeep Constants.EXTRA_CALL_UUID = "EXTRA_CALL_UUID"
                putString("EXTRA_CALL_UUID", callUUID)
                // Also include EXTRA_CALLER_NAME for compatibility
                putString("EXTRA_CALLER_NAME", callerName)
                // Legacy keys for backward compatibility
                putString("callUUID", callUUID)
                putString("name", callerName)
                putString("handle", callerName)
            }

            Log.d(TAG, "Registering call with TelecomManager - callUUID: $callUUID, callerName: $callerName, extras keys: ${extras.keySet()}")

            // Register the incoming call with the OS
            telecomManager.addNewIncomingCall(phoneAccountHandle, extras)
            Log.d(TAG, "Successfully registered incoming call with TelecomManager: $callUUID")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException registering call with TelecomManager. MANAGE_OWN_CALLS permission may be missing.", e)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register call with TelecomManager", e)
        }
    }

    /**
     * Shows incoming call notification with full-screen intent for locked devices
     * and heads-up notification for unlocked devices.
     * Falls back to HUN only if full-screen intent permission is not granted (Android 14+).
     */
    private fun showIncomingCallNotification(bundle: Bundle, voipPayload: VoipPayload, callUUID: String, callerName: String) {
        val callId = voipPayload.callId ?: ""
        val notificationId = callId.hashCode()

        Log.d(TAG, "Showing incoming call notification for VoIP call from: $callerName")

        // Check if we can use full-screen intent (Android 14+)
        val canUseFullScreen = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            notificationManager?.canUseFullScreenIntent() ?: false
        } else {
            true // Always available on Android 13 and below
        }

        // Create full-screen intent to IncomingCallActivity
        val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            putExtra("callId", callId)
            putExtra("callUUID", callUUID)
            putExtra("callerName", callerName)
            putExtra("host", voipPayload.host ?: "")
        }
        val fullScreenPendingIntent = createPendingIntent(notificationId, fullScreenIntent)

        // Create Accept action
        val acceptIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("voipAction", true)
            putExtra("event", "accept")
            putExtra("callId", callId)
            putExtra("callUUID", callUUID)
            putExtra("callerName", callerName)
            putExtra("host", voipPayload.host ?: "")
            putExtra("notificationId", notificationId)
        }
       val acceptPendingIntent = createPendingIntent(notificationId + 1, acceptIntent)

        // Create Decline action
        val declineIntent = Intent(context, DeclineReceiver::class.java).apply {
            action = ACTION_DECLINE
            putExtra("callUUID", callUUID)
            putExtra("host", voipPayload.host ?: "")
        }
        val declinePendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.getBroadcast(
                context,
                notificationId + 2,
                declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else {
            PendingIntent.getBroadcast(
                context,
                notificationId + 2,
                declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
            )
        }

        // Get icons
        val packageName = context.packageName
        val smallIconResId = context.resources.getIdentifier("ic_notification", "drawable", packageName)

        // Avatar not available in VoipPayload format (would require caller username)
        val avatarBitmap: Bitmap? = null

        // Build notification
        val builder = NotificationCompat.Builder(context, CHANNEL_ID).apply {
            setSmallIcon(smallIconResId)
            setContentTitle("Incoming call")
            setContentText("Call from $callerName")
            priority = NotificationCompat.PRIORITY_MAX
            setCategory(NotificationCompat.CATEGORY_CALL)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setAutoCancel(false)
            setOngoing(true)
            addAction(0, "Decline", declinePendingIntent)
            addAction(0, "Accept", acceptPendingIntent)

            if (avatarBitmap != null) {
                setLargeIcon(avatarBitmap)
            }

            // Set full-screen intent only if permission is granted
            if (canUseFullScreen) {
                setFullScreenIntent(fullScreenPendingIntent, true)
                Log.d(TAG, "Full-screen intent enabled - locked device will show Activity, unlocked will show HUN")
            } else {
                Log.w(TAG, "Full-screen intent permission not granted - showing HUN only (fallback)")
                // Still set content intent so tapping notification opens the activity
                setContentIntent(fullScreenPendingIntent)
            }
        }

        // Set sound for pre-O devices
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            builder.setSound(ringtoneUri)
        }

        // Show notification
        notificationManager?.notify(notificationId, builder.build())
        Log.d(TAG, "VoIP notification displayed with ID: $notificationId")
    }

    /**
     * Creates a PendingIntent with appropriate flags for the Android version.
     */
    private fun createPendingIntent(requestCode: Int, intent: Intent): PendingIntent {
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getActivity(context, requestCode, intent, flags)
    }

    /**
     * Cancels a VoIP call by callId.
     *
     * @param callId The call ID
     */
    fun cancelCall(callId: String) {
        val notificationId = callId.hashCode()
        cancelById(context, notificationId)
        VoipModule.clearPendingVoipCall(context)
    }
}
