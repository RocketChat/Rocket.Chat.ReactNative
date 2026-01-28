package chat.rocket.reactnative.voip

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.util.Log
import androidx.core.content.ContextCompat
import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.R

/**
 * Full-screen Activity displayed when an incoming VoIP call arrives.
 * Shows on lock screen and handles user actions (Accept/Decline).
 */
class IncomingCallActivity : Activity() {

    companion object {
        private const val TAG = "RocketChat.IncomingCall"
        private const val EXTRA_CALL_ID = "callId"
        private const val EXTRA_CALL_UUID = "callUUID"
        private const val EXTRA_CALLER = "caller"
        private const val EXTRA_HOST = "host"
    }

    private var ringtone: Ringtone? = null
    private var callUUID: String? = null
    private var callId: String? = null
    private var caller: String? = null
    private var host: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Samsung/Xiaomi fix: Request keyguard dismissal BEFORE setting content view
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        }

        // Android 14+ fix: Must call programmatically (XML attributes ignored)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            // Enable showing on lock screen (for older Android versions)
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_incoming_call)

        // Get call data from intent
        callId = intent.getStringExtra(EXTRA_CALL_ID)
        callUUID = intent.getStringExtra(EXTRA_CALL_UUID)
        caller = intent.getStringExtra(EXTRA_CALLER)
        host = intent.getStringExtra(EXTRA_HOST)

        Log.d(TAG, "IncomingCallActivity created - callUUID: $callUUID, caller: $caller")

        // Update UI
        updateUI()

        // Start ringtone
        startRingtone()

        // Setup button listeners
        setupButtons()
    }

    private fun updateUI() {
        val callerView = findViewById<TextView>(R.id.caller_name)
        callerView?.text = caller

        // Try to load avatar if available
        // TODO: needs username to load avatar
        val avatarView = findViewById<ImageView>(R.id.caller_avatar)
        // Avatar loading would require additional data - can be enhanced later
        // For now, just show a placeholder or default icon
    }

    private fun startRingtone() {
        try {
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ringtone = RingtoneManager.getRingtone(applicationContext, ringtoneUri)
            ringtone?.play()
            Log.d(TAG, "Ringtone started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start ringtone", e)
        }
    }

    private fun stopRingtone() {
        try {
            ringtone?.stop()
            ringtone = null
            Log.d(TAG, "Ringtone stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop ringtone", e)
        }
    }

    private fun setupButtons() {
        val acceptButton = findViewById<ImageButton>(R.id.btn_accept)
        val declineButton = findViewById<ImageButton>(R.id.btn_decline)

        acceptButton?.setOnClickListener {
            handleAccept()
        }

        declineButton?.setOnClickListener {
            handleDecline()
        }
    }

    private fun handleAccept() {
        Log.d(TAG, "Call accepted - callUUID: $callUUID")
        stopRingtone()

        // Cancel notification
        callUUID?.let { uuid ->
            val notificationId = uuid.replace("-", "").hashCode()
            VoipNotification.cancelById(this, notificationId)
        }

        // Store pending call data before emitting event (fixes race condition)
        // if (callUUID != null && callId != null && caller != null && host != null) {
        //     VoipModule.storePendingVoipCall(this, callId, callUUID, caller, host, "accept")
        // }

        // Launch MainActivity with call data
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("voipAction", true)
            putExtra("event", "accept")
            putExtra("callId", callId)
            putExtra("callUUID", callUUID)
            putExtra("caller", caller)
            putExtra("host", host)
        }
        startActivity(launchIntent)

        finish()
    }

    private fun handleDecline() {
        Log.d(TAG, "Call declined - callUUID: $callUUID")
        stopRingtone()

        // Cancel notification
        callUUID?.let { uuid ->
            val notificationId = uuid.replace("-", "").hashCode()
            VoipNotification.cancelById(this, notificationId)
        }

        // Emit event to JS
        // TODO: call restapi to decline the call
        callUUID?.let { uuid ->
            VoipModule.emitCallDeclined(uuid)
        }

        // Clear stored call data
        VoipModule.clearPendingVoipCall(this)

        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRingtone()
    }

    override fun onBackPressed() {
        // Treat back button as decline
        handleDecline()
    }
}
