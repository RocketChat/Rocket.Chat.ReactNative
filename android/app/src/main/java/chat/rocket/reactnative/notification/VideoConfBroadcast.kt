package chat.rocket.reactnative.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import chat.rocket.reactnative.MainActivity
import com.google.gson.GsonBuilder

/**
 * Handles video conference notification actions (accept/decline).
 * Stores the action for the JS layer to process when the app opens.
 */
class VideoConfBroadcast : BroadcastReceiver() {

    companion object {
        private const val TAG = "RocketChat.VideoConf"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        val extras = intent.extras

        if (action == null || extras == null) {
            Log.w(TAG, "Received broadcast with null action or extras")
            return
        }

        Log.d(TAG, "Received video conf action: $action")

        val event = when (action) {
            VideoConfNotification.ACTION_ACCEPT -> "accept"
            VideoConfNotification.ACTION_DECLINE -> "decline"
            else -> {
                Log.w(TAG, "Unknown action: $action")
                return
            }
        }

        // Cancel the notification
        val notificationId = extras.getInt("notificationId", 0)
        if (notificationId != 0) {
            VideoConfNotification.cancelById(context, notificationId)
        }

        // Build data for JS layer
        val data = mapOf(
            "notificationType" to (extras.getString("notificationType") ?: "videoconf"),
            "rid" to (extras.getString("rid") ?: ""),
            "event" to event,
            "host" to (extras.getString("host") ?: ""),
            "callId" to (extras.getString("callId") ?: ""),
            "caller" to mapOf(
                "_id" to (extras.getString("callerId") ?: ""),
                "name" to (extras.getString("callerName") ?: "")
            )
        )

        // Store action for the JS layer to pick up
        val gson = GsonBuilder().create()
        val jsonData = gson.toJson(data)

        VideoConfModule.storePendingAction(context, jsonData)

        Log.d(TAG, "Stored video conf action: $event for rid: ${extras.getString("rid")}")

        // Launch the app
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(extras)
            putExtra("event", event)
        }
        context.startActivity(launchIntent)
    }
}
