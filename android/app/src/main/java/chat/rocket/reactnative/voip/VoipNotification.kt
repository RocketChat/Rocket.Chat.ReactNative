package chat.rocket.reactnative.voip

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import android.content.ComponentName
import android.net.Uri
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import io.wazo.callkeep.VoiceConnection
import io.wazo.callkeep.VoiceConnectionService
import android.app.Activity
import android.app.KeyguardManager
import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.notification.Ejson
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

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

        /**
         * Set on the heads-up Accept action [PendingIntent] ([PendingIntent.getActivity] → MainActivity).
         * Android 12+ blocks starting an activity from a notification [BroadcastReceiver] trampoline;
         * MainActivity opens first, then [handleMainActivityVoipIntent] runs accept with
         * [handleAcceptAction] and `skipLaunchMainActivity = true`.
         */
        const val ACTION_VOIP_ACCEPT_HEADS_UP = "chat.rocket.reactnative.ACTION_VOIP_ACCEPT_HEADS_UP"
        const val ACTION_TIMEOUT = "chat.rocket.reactnative.ACTION_VOIP_TIMEOUT"
        const val ACTION_DISMISS = "chat.rocket.reactnative.ACTION_VOIP_DISMISS"

        // react-native-callkeep's ConnectionService class name
        private const val CALLKEEP_CONNECTION_SERVICE_CLASS = "io.wazo.callkeep.VoiceConnectionService"
        private const val DISCONNECT_REASON_MISSED = 6

        private data class VoipMediaCallIdentity(val userId: String, val deviceId: String)

        /** Keep in sync with MediaSessionStore features (audio-only today). */
        private val SUPPORTED_VOIP_FEATURES = JSONArray().apply { put("audio") }
        private val timeoutHandler = Handler(Looper.getMainLooper())
        private val timeoutCallbacks = mutableMapOf<String, Runnable>()
        private val ddpRegistry = VoipPerCallDdpRegistry<DDPClient> { client ->
            client.clearQueuedMethodCalls()
            client.disconnect()
        }

        /** False when [callId] was reassigned or torn down (stale DDP callback). */
        private fun isLiveClient(callId: String, client: DDPClient) = ddpRegistry.clientFor(callId) === client

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
            ddpRegistry.stopClient(payload.callId)
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
            val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            MediaCallsAnswerRequest.fetch(
                context = context,
                host = payload.host,
                callId = payload.callId,
                contractId = deviceId,
                answer = "reject",
                supportedFeatures = null
            ) { _ -> }
            rejectIncomingCall(payload.callId)
            cancelById(context, payload.notificationId)
            LocalBroadcastManager.getInstance(context).sendBroadcast(
                Intent(ACTION_DISMISS).apply {
                    putExtras(payload.toBundle())
                }
            )
        }

        /**
         * Routes VoIP-related intents delivered to [MainActivity] (cold start or [Activity.onNewIntent]).
         *
         * @return `true` if the intent was handled as VoIP and downstream handlers should not process it.
         */
        @JvmStatic
        fun handleMainActivityVoipIntent(context: Context, intent: Intent): Boolean {
            val payload = VoipPayload.fromBundle(intent.extras)
            if (payload == null || !payload.isVoipIncomingCall()) {
                return false
            }

            val headsUpAccept = intent.action == ACTION_VOIP_ACCEPT_HEADS_UP
            if (headsUpAccept) {
                intent.action = Intent.ACTION_MAIN
                prepareMainActivityForIncomingVoip(context, payload, storePayloadForJs = false)
                handleAcceptAction(context, payload, skipLaunchMainActivity = true)
                intent.removeExtra("voipAction")
                return true
            }

            if (intent.getBooleanExtra("voipAction", false)) {
                prepareMainActivityForIncomingVoip(context, payload)
                intent.removeExtra("voipAction")
                return true
            }

            return false
        }

        /**
         * Prepares MainActivity after launch with incoming-call context: cancel notification and timeout,
         * stash payload for JS, and unlock/show above keyguard when [context] is an [Activity].
         */
        private fun prepareMainActivityForIncomingVoip(
            context: Context,
            payload: VoipPayload,
            storePayloadForJs: Boolean = true
        ) {
            Log.d(TAG, "prepareMainActivityForIncomingVoip — callId: ${payload.callId}")
            cancelById(context, payload.notificationId)
            cancelTimeout(payload.callId)
            if (storePayloadForJs) {
                VoipModule.storeInitialEvents(payload)
            }

            if (context is Activity && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                context.setShowWhenLocked(true)
                context.setTurnScreenOn(true)
                val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                keyguardManager.requestDismissKeyguard(context, null)
            }
        }

        /**
         * Accept from notification or IncomingCallActivity: send accept over native DDP, sync Telecom,
         * dismiss UI, then open MainActivity (unless [skipLaunchMainActivity] — already in MainActivity
         * from heads-up Accept [PendingIntent.getActivity]). JS still runs answerCall afterward.
         *
         * The DDP call is asynchronous; [VoipModule.storeInitialEvents], notification cancel, Telecom
         * answer, and [ACTION_DISMISS] run from an internal completion callback. [IncomingCallActivity]
         * stays open until that broadcast is received.
         */
        @JvmStatic
        @JvmOverloads
        fun handleAcceptAction(context: Context, payload: VoipPayload, skipLaunchMainActivity: Boolean = false) {
            Log.d(TAG, "Accept action triggered for callId: ${payload.callId}")
            cancelTimeout(payload.callId)

            val appCtx = context.applicationContext
            // Guard so finish() is called at most once, whether by the DDP callback or the timeout.
            val finished = AtomicBoolean(false)
            val timeoutHandler = Handler(Looper.getMainLooper())
            var timeoutRunnable: Runnable? = null

            fun finish(ddpSuccess: Boolean) {
                if (!finished.compareAndSet(false, true)) return
                timeoutRunnable?.let { timeoutHandler.removeCallbacks(it) }
                ddpRegistry.stopClient(payload.callId)
                if (ddpSuccess) {
                    answerIncomingCall(payload.callId)
                    VoipModule.storeInitialEvents(payload)
                } else {
                    Log.d(TAG, "Native accept did not succeed over DDP for ${payload.callId}; opening app for JS recovery")
                    disconnectIncomingCall(payload.callId, false)
                    VoipModule.storeAcceptFailureForJs(payload)
                }
                cancelById(appCtx, payload.notificationId)
                LocalBroadcastManager.getInstance(appCtx).sendBroadcast(
                    Intent(ACTION_DISMISS).apply {
                        putExtras(payload.toBundle())
                    }
                )
                if (!skipLaunchMainActivity) {
                    launchMainActivityForVoip(context, payload)
                }
            }

            val postedTimeout = Runnable {
                Log.w(TAG, "Native accept timed out for ${payload.callId}; falling back to JS recovery")
                finish(false)
            }
            timeoutRunnable = postedTimeout
            timeoutHandler.postDelayed(postedTimeout, 10_000L)

            val client = ddpRegistry.clientFor(payload.callId)
            if (client == null) {
                Log.d(TAG, "Native DDP client unavailable for accept ${payload.callId}")
                finish(false)
                return
            }

            if (ddpRegistry.isLoggedIn(payload.callId)) {
                sendAcceptSignal(context, payload) { success ->
                    finish(success)
                }
            } else {
                queueAcceptSignal(context, payload) { success ->
                    finish(success)
                }
            }
        }

        private fun launchMainActivityForVoip(context: Context, payload: VoipPayload) {
            val intent = Intent(context, MainActivity::class.java).apply {
                putExtras(payload.toBundle())
                if (context is Activity) {
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                } else {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
            }
            context.startActivity(intent)
        }

        private fun answerIncomingCall(callId: String) {
            val connection = VoiceConnectionService.getConnection(callId)
            when (connection) {
                is VoiceConnection -> connection.onAnswer()
                null -> Log.d(TAG, "No active VoiceConnection found for accepted call: $callId")
                else -> Log.d(TAG, "Non-VoiceConnection for accept, callId: $callId")
            }
        }

        // TODO: unify these three functions and check VoiceConnectionService
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

        private fun sendRejectSignal(context: Context, payload: VoipPayload) {
            val client = ddpRegistry.clientFor(payload.callId)
            if (client == null) {
                Log.d(TAG, "Native DDP client unavailable, cannot send reject for ${payload.callId}")
                return
            }

            val params = buildRejectSignalParams(context, payload) ?: return

            client.callMethod("stream-notify-user", params) { success ->
                Log.d(TAG, "Native reject signal result for ${payload.callId}: $success")
                ddpRegistry.stopClient(payload.callId)
            }
        }

        private fun queueRejectSignal(context: Context, payload: VoipPayload) {
            val client = ddpRegistry.clientFor(payload.callId)
            if (client == null) {
                Log.d(TAG, "Native DDP client unavailable, cannot queue reject for ${payload.callId}")
                return
            }

            val params = buildRejectSignalParams(context, payload) ?: return

            client.queueMethodCall("stream-notify-user", params) { success ->
                Log.d(TAG, "Queued native reject signal result for ${payload.callId}: $success")
                ddpRegistry.stopClient(payload.callId)
            }
            Log.d(TAG, "Queued native reject signal for ${payload.callId}")
        }

        private fun flushPendingQueuedSignalsIfNeeded(callId: String): Boolean {
            val client = ddpRegistry.clientFor(callId) ?: return false
            if (!client.hasQueuedMethodCalls()) {
                return false
            }

            client.flushQueuedMethodCalls()
            return true
        }

        private fun sendAcceptSignal(
            context: Context,
            payload: VoipPayload,
            onComplete: (Boolean) -> Unit
        ) {
            val client = ddpRegistry.clientFor(payload.callId)
            if (client == null) {
                Log.d(TAG, "Native DDP client unavailable, cannot send accept for ${payload.callId}")
                onComplete(false)
                return
            }

            val params = buildAcceptSignalParams(context, payload) ?: run {
                onComplete(false)
                return
            }

            client.callMethod("stream-notify-user", params) { success ->
                Log.d(TAG, "Native accept signal result for ${payload.callId}: $success")
                onComplete(success)
            }
        }

        private fun queueAcceptSignal(
            context: Context,
            payload: VoipPayload,
            onComplete: (Boolean) -> Unit
        ) {
            val client = ddpRegistry.clientFor(payload.callId)
            if (client == null) {
                Log.d(TAG, "Native DDP client unavailable, cannot queue accept for ${payload.callId}")
                onComplete(false)
                return
            }

            val params = buildAcceptSignalParams(context, payload) ?: run {
                onComplete(false)
                return
            }

            client.queueMethodCall("stream-notify-user", params) { success ->
                Log.d(TAG, "Queued native accept signal result for ${payload.callId}: $success")
                onComplete(success)
            }
            Log.d(TAG, "Queued native accept signal for ${payload.callId}")
        }

        /**
         * Resolves user id for this host and Android [Settings.Secure.ANDROID_ID] as media-signaling contractId.
         * Must match JS `getUniqueIdSync()` from react-native-device-info (iOS native code uses `DeviceUID`).
         */
        private fun resolveVoipMediaCallIdentity(context: Context, payload: VoipPayload): VoipMediaCallIdentity? {
            val ejson = Ejson().apply {
                host = payload.host
            }
            val userId = ejson.userId()
            if (userId.isNullOrEmpty()) {
                Log.d(TAG, "Missing userId, cannot build stream-notify-user params for ${payload.callId}")
                ddpRegistry.stopClient(payload.callId)
                return null
            }
            val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            if (deviceId.isNullOrEmpty()) {
                Log.d(TAG, "Missing deviceId, cannot build stream-notify-user params for ${payload.callId}")
                ddpRegistry.stopClient(payload.callId)
                return null
            }
            return VoipMediaCallIdentity(userId, deviceId)
        }

        private fun buildAcceptSignalParams(context: Context, payload: VoipPayload): JSONArray? {
            val ids = resolveVoipMediaCallIdentity(context, payload) ?: return null
            val signal = JSONObject().apply {
                put("callId", payload.callId)
                put("contractId", ids.deviceId)
                put("type", "answer")
                put("answer", "accept")
                put("supportedFeatures", SUPPORTED_VOIP_FEATURES)
            }
            return JSONArray().apply {
                put("${ids.userId}/media-calls")
                put(signal.toString())
            }
        }

        private fun buildRejectSignalParams(context: Context, payload: VoipPayload): JSONArray? {
            val ids = resolveVoipMediaCallIdentity(context, payload) ?: return null
            val signal = JSONObject().apply {
                put("callId", payload.callId)
                put("contractId", ids.deviceId)
                put("type", "answer")
                put("answer", "reject")
            }
            return JSONArray().apply {
                put("${ids.userId}/media-calls")
                put(signal.toString())
            }
        }

        /**
         * True when the user is already in a call: this app's Telecom connections (ringing, dialing,
         * active, hold — same idea as iOS CXCallObserver "any non-ended"), any system in-call state
         * (API 26+ when READ_PHONE_STATE is granted), or audio in communication mode (fallback on all
         * API levels when Telecom is unavailable or denied).
         */
        private fun hasActiveCall(context: Context): Boolean {
            val ownBusy = VoiceConnectionService.currentConnections.values.any { connection ->
                when (connection.state) {
                    android.telecom.Connection.STATE_RINGING,
                    android.telecom.Connection.STATE_DIALING,
                    android.telecom.Connection.STATE_ACTIVE,
                    android.telecom.Connection.STATE_HOLDING -> true
                    else -> false
                }
            }
            if (ownBusy) {
                return true
            }
            return hasSystemLevelActiveCallIndicators(context)
        }

        /**
         * Telecom in-call check (API 26+) requires [READ_PHONE_STATE]; without it, [TelecomManager.isInCall]
         * can throw [SecurityException]. Always falls back to [AudioManager.MODE_IN_COMMUNICATION] or
         * [AudioManager.MODE_IN_CALL] on all APIs to catch both VoIP and cellular calls.
         */
        private fun hasSystemLevelActiveCallIndicators(context: Context): Boolean {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) ==
                    PackageManager.PERMISSION_GRANTED
                if (granted) {
                    val telecom = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                    try {
                        if (telecom?.isInCall == true) {
                            return true
                        }
                    } catch (e: SecurityException) {
                        Log.w(TAG, "TelecomManager.isInCall not allowed", e)
                    }
                }
            }
            val audio = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            if (audio?.mode == AudioManager.MODE_IN_COMMUNICATION || audio?.mode == AudioManager.MODE_IN_CALL) {
                return true
            }
            return false
        }

        /**
         * Rejects an incoming call because the user is already on another call.
         *
         * Uses [connectAndRejectBusy] — a lightweight DDP flow that only connects,
         * logs in, sends the reject signal, and tears down the client. Unlike
         * [startListeningForCallEnd] (used by the normal incoming-call path), this
         * does NOT subscribe to `stream-notify-user` or install a collection-message
         * handler, because no incoming-call UI was ever shown and there is nothing
         * to dismiss if the caller hangs up or another device answers.
         */
        @JvmStatic
        fun rejectBusyCall(context: Context, payload: VoipPayload) {
            Log.d(TAG, "Rejected busy call ${payload.callId} — user already on a call")
            cancelTimeout(payload.callId)
            connectAndRejectBusy(context, payload)
        }

        /**
         * Minimal DDP flow for busy-reject: connect → login → send reject → stop.
         *
         * Intentionally omits the `stream-notify-user` subscription and the
         * `onCollectionMessage` handler that [startListeningForCallEnd] sets up,
         * since the busy path never shows UI — there are no notifications to
         * dismiss and no call-end events to observe.
         */
        private fun connectAndRejectBusy(context: Context, payload: VoipPayload) {
            val ejson = Ejson()
            ejson.host = payload.host
            val userId = ejson.userId()
            val token = ejson.token()

            if (userId.isNullOrEmpty() || token.isNullOrEmpty()) {
                Log.d(TAG, "No credentials for ${payload.host}, skipping busy-reject DDP")
                return
            }

            val callId = payload.callId
            val client = DDPClient()
            ddpRegistry.putClient(callId, client)

            Log.d(TAG, "Connecting DDP to send busy-reject for call $callId")

            client.connect(payload.host) { connected ->
                if (!isLiveClient(callId, client)) {
                    return@connect
                }
                if (!connected) {
                    Log.d(TAG, "DDP connection failed for busy-reject $callId")
                    ddpRegistry.stopClient(callId)
                    return@connect
                }

                client.login(token) { loggedIn ->
                    if (!isLiveClient(callId, client)) {
                        return@login
                    }
                    if (!loggedIn) {
                        Log.d(TAG, "DDP login failed for busy-reject $callId")
                        ddpRegistry.stopClient(callId)
                        return@login
                    }

                    ddpRegistry.markLoggedIn(callId)
                    sendRejectSignal(context, payload)
                }
            }
        }

        // -- Native DDP Listener (Call End Detection) --

        @JvmStatic
        fun startListeningForCallEnd(context: Context, payload: VoipPayload) {
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
            ddpRegistry.putClient(callId, client)

            Log.d(TAG, "Starting DDP listener for call $callId")

            client.onCollectionMessage = collector@{ message ->
                if (!isLiveClient(callId, client)) {
                    return@collector
                }
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
                            val signalNotification = firstArg.optString("notification")
                            val signedContractId = firstArg.optString("signedContractId")

                            if (signalCallId == callId) {
                                if (signalType == "notification" &&
                                    (
                                        // accepted from other device
                                        (!signedContractId.isNullOrEmpty() && signedContractId != deviceId) ||
                                        // hung up by other device
                                        (signalNotification == "hangup")
                                    )) {
                                    val appContext = context.applicationContext
                                    Handler(Looper.getMainLooper()).post {
                                        if (!isLiveClient(callId, client)) {
                                            return@post
                                        }
                                        cancelTimeout(callId)
                                        disconnectIncomingCall(callId, false)
                                        cancelById(appContext, payload.notificationId)
                                        LocalBroadcastManager.getInstance(appContext).sendBroadcast(
                                            Intent(ACTION_DISMISS).apply {
                                                putExtras(payload.toBundle())
                                            }
                                        )
                                        ddpRegistry.stopClient(callId)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            client.connect(payload.host) { connected ->
                if (!isLiveClient(callId, client)) {
                    return@connect
                }
                if (!connected) {
                    Log.d(TAG, "DDP connection failed")
                    ddpRegistry.stopClient(callId)
                    return@connect
                }

                client.login(token) { loggedIn ->
                    if (!isLiveClient(callId, client)) {
                        return@login
                    }
                    if (!loggedIn) {
                        Log.d(TAG, "DDP login failed")
                        ddpRegistry.stopClient(callId)
                        return@login
                    }

                    ddpRegistry.markLoggedIn(callId)
                    if (flushPendingQueuedSignalsIfNeeded(callId)) {
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
                        if (!isLiveClient(callId, client)) {
                            return@subscribe
                        }
                        Log.d(TAG, "DDP subscribe result: $subscribed")
                        if (!subscribed) {
                            ddpRegistry.stopClient(callId)
                        }
                    }
                }
            }

        }

        @JvmStatic
        fun stopDDPClient() {
            Log.d(TAG, "stopDDPClient called from JS")
            ddpRegistry.stopAllClients()
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
            voipPayload.isVoipIncomingCall() -> {
                val isValidForIncoming =
                    voipPayload.getRemainingLifetimeMs() != null && !voipPayload.isExpired()
                when (decideIncomingVoipPushAction(isValidForIncoming, hasActiveCall(context))) {
                    VoipIncomingPushAction.STALE -> {
                        if (voipPayload.getRemainingLifetimeMs() == null) {
                            Log.w(
                                TAG,
                                "Skipping incoming VoIP call without a valid createdAt timestamp - callId: ${voipPayload.callId}"
                            )
                        } else {
                            Log.d(TAG, "Skipping expired incoming VoIP call - callId: ${voipPayload.callId}")
                        }
                    }
                    VoipIncomingPushAction.REJECT_BUSY -> rejectBusyCall(context, voipPayload)
                    VoipIncomingPushAction.SHOW_INCOMING -> showIncomingCall(voipPayload)
                }
            }
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
                // TODO: i18n
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

        // Accept: must use getActivity — Android 12+ blocks starting MainActivity from a
        // notification BroadcastReceiver ("trampoline"). MainActivity runs native accept with
        // skipLaunchMainActivity after opening.
        val acceptIntent = Intent(context, MainActivity::class.java).apply {
            action = ACTION_VOIP_ACCEPT_HEADS_UP
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtras(voipPayload.toBundle())
        }
        val acceptPendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.getActivity(
                context,
                notificationId + 1,
                acceptIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else {
            PendingIntent.getActivity(
                context,
                notificationId + 1,
                acceptIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
            )
        }

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
