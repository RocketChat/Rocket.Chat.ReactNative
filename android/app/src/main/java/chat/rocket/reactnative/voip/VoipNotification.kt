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
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import android.content.ComponentName
import android.net.Uri
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import io.wazo.callkeep.VoiceConnection
import io.wazo.callkeep.VoiceConnectionService
import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.notification.Ejson
import org.json.JSONArray
import org.json.JSONObject

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
        const val ACTION_TIMEOUT = "chat.rocket.reactnative.ACTION_VOIP_TIMEOUT"
        const val ACTION_DISMISS = "chat.rocket.reactnative.ACTION_VOIP_DISMISS"

        // react-native-callkeep's ConnectionService class name
        private const val CALLKEEP_CONNECTION_SERVICE_CLASS = "io.wazo.callkeep.VoiceConnectionService"
        private const val DISCONNECT_REASON_MISSED = 6
        private const val INCOMING_CALL_LIFETIME_MS = 60_000L
        private val timeoutHandler = Handler(Looper.getMainLooper())
        private val timeoutCallbacks = mutableMapOf<String, Runnable>()
        private var ddpClient: DDPClient? = null
        private var ddpDisconnectRunnable: Runnable? = null

        /**
         * Cancels a VoIP notification by ID.
         */
        @JvmStatic
        fun cancelById(context: Context, notificationId: Int) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.cancel(notificationId)
            Log.d(TAG, "VoIP notification cancelled with ID: $notificationId")
        }

        @JvmStatic
        fun scheduleTimeout(context: Context, payload: VoipPayload) {
            val delayMs = payload.getRemainingLifetimeMs()
            if (delayMs == null || delayMs <= 0L) {
                Log.d(TAG, "Skipping timeout scheduling for expired or invalid call: ${payload.callId}")
                return
            }

            cancelTimeout(payload.callId)

            val applicationContext = context.applicationContext
            val timeoutRunnable = Runnable {
                synchronized(timeoutCallbacks) {
                    timeoutCallbacks.remove(payload.callId)
                }
                handleTimeout(applicationContext, payload)
            }

            synchronized(timeoutCallbacks) {
                timeoutCallbacks[payload.callId] = timeoutRunnable
            }
            timeoutHandler.postDelayed(timeoutRunnable, delayMs)
            Log.d(TAG, "Scheduled VoIP timeout for ${payload.callId} in ${delayMs}ms")
        }

        @JvmStatic
        fun cancelTimeout(callId: String) {
            val timeoutRunnable = synchronized(timeoutCallbacks) {
                timeoutCallbacks.remove(callId)
            }
            if (timeoutRunnable != null) {
                timeoutHandler.removeCallbacks(timeoutRunnable)
                Log.d(TAG, "Cancelled VoIP timeout for $callId")
            }
        }

        @JvmStatic
        fun handleTimeout(context: Context, payload: VoipPayload) {
            cancelTimeout(payload.callId)
            disconnectTimedOutCall(payload.callId)
            cancelById(context, payload.notificationId)
            LocalBroadcastManager.getInstance(context).sendBroadcast(
                Intent(ACTION_TIMEOUT).apply {
                    putExtras(payload.toBundle())
                }
            )
            Log.d(TAG, "Timed out incoming VoIP call: ${payload.callId}")
        }

        /**
         * Handles decline action for VoIP call.
         * Logs the decline action and clears stored call data.
         */
        @JvmStatic
        fun handleDeclineAction(context: Context, payload: VoipPayload) {
            Log.d(TAG, "Decline action triggered for callId: ${payload.callId}")
            cancelTimeout(payload.callId)
            rejectIncomingCall(payload.callId)
            cancelById(context, payload.notificationId)
            // TODO: call restapi to decline the call
        }

        private fun disconnectTimedOutCall(callId: String) {
            val connection = VoiceConnectionService.getConnection(callId)
            when (connection) {
                is VoiceConnection -> connection.reportDisconnect(DISCONNECT_REASON_MISSED)
                null -> Log.d(TAG, "No active VoiceConnection found for timed out call: $callId")
                else -> connection.onDisconnect()
            }
        }

        private fun rejectIncomingCall(callId: String) {
            val connection = VoiceConnectionService.getConnection(callId)
            when (connection) {
                is VoiceConnection -> connection.onReject()
                null -> Log.d(TAG, "No active VoiceConnection found for declined call: $callId")
                else -> connection.onDisconnect()
            }
        }

        private fun disconnectIncomingCall(callId: String, reportAsMissed: Boolean) {
            val connection = VoiceConnectionService.getConnection(callId)
            when (connection) {
                is VoiceConnection -> {
                    if (reportAsMissed) {
                        connection.reportDisconnect(DISCONNECT_REASON_MISSED)
                    } else {
                        connection.onDisconnect()
                    }
                }
                null -> Log.d(TAG, "No active VoiceConnection found for dismissed call: $callId")
                else -> connection.onDisconnect()
            }
        }

        // -- Native DDP Listener (Call End Detection) --

        @JvmStatic
        fun startListeningForCallEnd(context: Context, payload: VoipPayload) {
            stopDDPClientInternal()

            val ejson = Ejson()
            ejson.host = payload.host
            val userId = ejson.userId()
            val token = ejson.token()

            if (userId.isNullOrEmpty() || token.isNullOrEmpty()) {
                Log.d(TAG, "No credentials for ${payload.host}, skipping DDP listener")
                return
            }

            val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            val callId = payload.callId
            val client = DDPClient()
            ddpClient = client

            Log.d(TAG, "Starting DDP listener for call $callId")

            client.onCollectionMessage = { message ->
                Log.d(TAG, "DDP received message: $message")
                val fields = message.optJSONObject("fields")
                if (fields != null) {
                    val eventName = fields.optString("eventName")
                    if (eventName.endsWith("/media-signal")) {
                        val args = fields.optJSONArray("args")
                        val firstArg = args?.optJSONObject(0)
                        if (firstArg != null) {
                            val signalType = firstArg.optString("type")
                            val signalCallId = firstArg.optString("callId")
                            val signedContractId = firstArg.optString("signedContractId")

                            if (signalType == "notification" && signalCallId == callId && signedContractId != null && signedContractId != deviceId) {
                                Log.d(TAG, "DDP received hangup for call $callId")
                                val appContext = context.applicationContext
                                Handler(Looper.getMainLooper()).post {
                                    cancelTimeout(callId)
                                    disconnectIncomingCall(callId, true)
                                    cancelById(appContext, payload.notificationId)
                                    LocalBroadcastManager.getInstance(appContext).sendBroadcast(
                                        Intent(ACTION_DISMISS).apply {
                                            putExtras(payload.toBundle())
                                        }
                                    )
                                    stopDDPClientInternal()
                                }
                            }
                        }
                    }
                }
            }

            client.connect(payload.host) { connected ->
                if (!connected) {
                    Log.d(TAG, "DDP connection failed")
                    stopDDPClientInternal()
                    return@connect
                }

                client.login(token) { loggedIn ->
                    if (!loggedIn) {
                        Log.d(TAG, "DDP login failed")
                        stopDDPClientInternal()
                        return@login
                    }

                    val params = JSONArray().apply {
                        put("$userId/media-signal")
                        put(JSONObject().apply {
                            put("useCollection", false)
                            put("args", JSONArray().apply { put(false) })
                        })
                    }

                    client.subscribe("stream-notify-user", params) { subscribed ->
                        Log.d(TAG, "DDP subscribe result: $subscribed")
                        if (!subscribed) {
                            stopDDPClientInternal()
                        }
                    }
                }
            }

            scheduleDDPSafetyTimeout()
        }

        @JvmStatic
        fun stopDDPClient() {
            Log.d(TAG, "stopDDPClient called from JS")
            stopDDPClientInternal()
        }

        private fun stopDDPClientInternal() {
            ddpDisconnectRunnable?.let { timeoutHandler.removeCallbacks(it) }
            ddpDisconnectRunnable = null
            ddpClient?.disconnect()
            ddpClient = null
        }

        private fun scheduleDDPSafetyTimeout() {
            ddpDisconnectRunnable?.let { timeoutHandler.removeCallbacks(it) }

            val runnable = Runnable {
                Log.d(TAG, "DDP safety timeout reached, disconnecting")
                stopDDPClientInternal()
            }
            ddpDisconnectRunnable = runnable
            timeoutHandler.postDelayed(runnable, INCOMING_CALL_LIFETIME_MS)
        }
    }

    /**
     * BroadcastReceiver to handle decline actions from notification.
     */
    class DeclineReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val voipPayload = VoipPayload.fromBundle(intent.extras)
            voipPayload?.let { VoipNotification.handleDeclineAction(context, it) }
        }
    }

    private val notificationManager: NotificationManager? =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    init {
        createNotificationChannel()
    }

    fun onMessageReceived(voipPayload: VoipPayload) {
        when {
            voipPayload.isVoipIncomingCall() -> showIncomingCall(voipPayload)
            else -> Log.w(TAG, "Ignoring unsupported VoIP payload type: ${voipPayload.type}")
        }
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
    fun showIncomingCall(voipPayload: VoipPayload) {
        val callId = voipPayload.callId
        val caller = voipPayload.caller
        if (voipPayload.getRemainingLifetimeMs() == null) {
            Log.w(TAG, "Skipping incoming VoIP call without a valid createdAt timestamp - callId: $callId")
            return
        }

        if (voipPayload.isExpired()) {
            Log.d(TAG, "Skipping expired incoming VoIP call - callId: $callId")
            return
        }

        Log.d(TAG, "Showing incoming VoIP call - callId: $callId, caller: $caller")

        // CRITICAL: Register call with TelecomManager FIRST (required for audio focus, Bluetooth, priority, FSI exemption)
        // This triggers react-native-callkeep's ConnectionService
        registerCallWithTelecomManager(callId, caller)

        // Show notification with full-screen intent
        showIncomingCallNotification(voipPayload)
        scheduleTimeout(context, voipPayload)
        startListeningForCallEnd(context, voipPayload)
    }

    /**
     * Registers the incoming call with TelecomManager using react-native-callkeep's ConnectionService.
     * This is REQUIRED for:
     * 1. Audio focus (pauses media apps)
     * 2. Bluetooth headset support
     * 3. Higher process priority
     * 4. FSI exemption on Play Store
     */
    private fun registerCallWithTelecomManager(callId: String, caller: String) {
        try {
            // Validate inputs
            if (callId.isNullOrEmpty() || caller.isNullOrEmpty()) {
                Log.e(TAG, "Cannot register call with TelecomManager: callId is null or empty")
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
            val extras = Bundle().apply {
                val callerUri = Uri.fromParts(PhoneAccount.SCHEME_TEL, caller, null)
                putParcelable(TelecomManager.EXTRA_INCOMING_CALL_ADDRESS, callerUri)
                putString("EXTRA_CALL_UUID", callId)
                putString("EXTRA_CALLER_NAME", caller)
                putString("name", caller)
                putString("handle", caller)
            }

            Log.d(TAG, "Registering call with TelecomManager - callId: $callId, caller: $caller, extras keys: ${extras.keySet()}")

            // Register the incoming call with the OS
            telecomManager.addNewIncomingCall(phoneAccountHandle, extras)
            Log.d(TAG, "Successfully registered incoming call with TelecomManager: $callId")
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
    private fun showIncomingCallNotification(voipPayload: VoipPayload) {
        val caller = voipPayload.caller
        val notificationId = voipPayload.notificationId
        val remainingLifetimeMs = voipPayload.getRemainingLifetimeMs()
        if (remainingLifetimeMs == null || remainingLifetimeMs <= 0L) {
            Log.d(TAG, "Skipping notification for expired or invalid call: ${voipPayload.callId}")
            return
        }

        Log.d(TAG, "Showing incoming call notification for VoIP call from: $caller")

        // Check if we can use full-screen intent (Android 14+)
        val canUseFullScreen = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            notificationManager?.canUseFullScreenIntent() ?: false
        } else {
            true // Always available on Android 13 and below
        }

        // Create full-screen intent to IncomingCallActivity
        val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            putExtras(voipPayload.toBundle())
        }
        val fullScreenPendingIntent = createPendingIntent(notificationId, fullScreenIntent)

        // Create Accept action
        val acceptIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtras(voipPayload.toBundle())
        }
        val acceptPendingIntent = createPendingIntent(notificationId + 1, acceptIntent)

        // Create Decline action
        val declineIntent = Intent(context, DeclineReceiver::class.java).apply {
            action = ACTION_DECLINE
            putExtras(voipPayload.toBundle())
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
            setContentText("Call from $caller")
            priority = NotificationCompat.PRIORITY_MAX
            setCategory(NotificationCompat.CATEGORY_CALL)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setAutoCancel(false)
            setOngoing(true)
            setTimeoutAfter(remainingLifetimeMs)
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
}
