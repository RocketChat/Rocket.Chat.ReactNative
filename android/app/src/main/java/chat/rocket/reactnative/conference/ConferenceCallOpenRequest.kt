package chat.rocket.reactnative.conference

import android.content.Context
import android.content.Intent

object ConferenceCallOpenRequest {
    const val OPEN_REQUESTED_EVENT = "ConferenceCallOpenRequested"

    @Volatile
    private var pending = false

    @JvmStatic
    fun handleIntent(context: Context, intent: Intent): Boolean {
        if (!intent.getBooleanExtra(ConferenceCallService.EXTRA_OPEN_CALL, false)) {
            return false
        }
        intent.removeExtra(ConferenceCallService.EXTRA_OPEN_CALL)
        pending = true
        ConferenceEvents.emit(context, OPEN_REQUESTED_EVENT, null)
        return true
    }

    @JvmStatic
    fun consume(): Boolean {
        val requested = pending
        pending = false
        return requested
    }

    @JvmStatic
    fun clear() {
        pending = false
    }
}
