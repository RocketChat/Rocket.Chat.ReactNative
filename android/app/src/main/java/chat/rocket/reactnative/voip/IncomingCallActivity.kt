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
    }

    private var ringtone: Ringtone? = null
    private var voipPayload: VoipPayload? = null

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

        val voipPayload = VoipPayload.fromBundle(intent.extras)
        if (voipPayload == null || !voipPayload.isVoipIncomingCall()) {
            Log.e(TAG, "Invalid VoIP payload, finishing activity")
            finish()
            return
        }
        this.voipPayload = voipPayload

        Log.d(TAG, "IncomingCallActivity created - callUUID: ${voipPayload.callUUID}, caller: ${voipPayload.caller}")

        updateUI(voipPayload)
        startRingtone()
        setupButtons(voipPayload)
    }

    private fun updateUI(payload: VoipPayload) {
        val callerView = findViewById<TextView>(R.id.caller_name)
        callerView?.text = payload.caller

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

    private fun setupButtons(payload: VoipPayload) {
        val acceptButton = findViewById<ImageButton>(R.id.btn_accept)
        val declineButton = findViewById<ImageButton>(R.id.btn_decline)

        acceptButton?.setOnClickListener {
            handleAccept(payload)
        }

        declineButton?.setOnClickListener {
            handleDecline(payload)
        }
    }

    private fun handleAccept(payload: VoipPayload) {
        Log.d(TAG, "Call accepted - callUUID: ${payload.callUUID}")
        stopRingtone()

        // Launch MainActivity with call data
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(payload.toBundle())
        }
        startActivity(launchIntent)

        finish()
    }

    private fun handleDecline(payload: VoipPayload) {
        Log.d(TAG, "Call declined - callUUID: ${payload.callUUID}")
        stopRingtone()

        VoipNotification.cancelById(this, payload.notificationId)

        // Emit event to JS
        // TODO: call restapi to decline the call

        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRingtone()
    }

    override fun onBackPressed() {
        voipPayload?.let { handleDecline(it) } ?: finish()
    }
}
