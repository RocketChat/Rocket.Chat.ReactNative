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
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.util.Log
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CenterCrop
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.bumptech.glide.request.RequestOptions
import chat.rocket.reactnative.MainActivity
import chat.rocket.reactnative.R
import android.graphics.Typeface

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
        applyInterFont()

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

    private fun applyInterFont() {
        val interRegular = try {
            Typeface.createFromAsset(assets, "fonts/Inter-Regular.otf")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load Inter-Regular font", e)
            return
        }
        val interBold = try {
            Typeface.createFromAsset(assets, "fonts/Inter-Bold.otf")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load Inter-Bold font", e)
            interRegular
        }
        listOf(
            R.id.header_text,
            R.id.caller_avatar_initial,
            R.id.host_name,
            R.id.incoming_call_reject_label,
            R.id.incoming_call_accept_label
        ).forEach { id ->
            findViewById<TextView>(id)?.setTypeface(interRegular)
        }
        findViewById<TextView>(R.id.caller_name)?.setTypeface(interBold)
    }

    private fun updateUI(payload: VoipPayload) {
        findViewById<TextView>(R.id.caller_name)?.text = payload.caller.ifEmpty { "" }
        findViewById<TextView>(R.id.host_name)?.text = payload.hostName.ifEmpty { "" }

        // Avatar: initial as fallback, load from host/avatar/username when available
        val initialView = findViewById<TextView>(R.id.caller_avatar_initial)
        val avatarImageView = findViewById<ImageView>(R.id.caller_avatar_image)
        val initial = payload.caller.firstOrNull()?.uppercaseChar()?.toString() ?: "?"
        initialView?.text = initial

        // loadAvatar(payload, avatarImageView, initialView)
    }

    /**
     * Loads avatar from ${host}/avatar/username.
     * Falls back to initial letter if load fails or URL is invalid.
     * A proper avatar URL function can replace this later.
     */
    private fun loadAvatar(payload: VoipPayload, imageView: ImageView?, initialView: TextView?) {
        if (imageView == null || initialView == null) return
        if (payload.host.isBlank() || payload.caller.isBlank()) return

        val baseUrl = payload.host.trim().removeSuffix("/")
        val url = if (baseUrl.startsWith("http")) baseUrl else "https://$baseUrl"
        val username = payload.caller.trim().let { if (it.startsWith("@")) it else "@$it" }
        val avatarUrl = "$url/avatar/$username?format=png&size=240"

        val cornerRadiusPx = (8 * resources.displayMetrics.density).toInt()
        val requestOptions = RequestOptions()
            .transform(CenterCrop(), RoundedCorners(cornerRadiusPx))

        Glide.with(this)
            .load(avatarUrl)
            .apply(requestOptions)
            .into(object : com.bumptech.glide.request.target.CustomTarget<android.graphics.drawable.Drawable>(360, 360) {
                override fun onResourceReady(
                    resource: android.graphics.drawable.Drawable,
                    transition: com.bumptech.glide.request.transition.Transition<in android.graphics.drawable.Drawable>?
                ) {
                    initialView.visibility = View.GONE
                    imageView.visibility = View.VISIBLE
                    imageView.setImageDrawable(resource)
                }

                override fun onLoadCleared(placeholder: android.graphics.drawable.Drawable?) {
                    initialView.visibility = View.VISIBLE
                    imageView.visibility = View.GONE
                }
            })
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
        findViewById<LinearLayout>(R.id.btn_accept)?.setOnClickListener {
            handleAccept(payload)
        }

        findViewById<LinearLayout>(R.id.btn_decline)?.setOnClickListener {
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
