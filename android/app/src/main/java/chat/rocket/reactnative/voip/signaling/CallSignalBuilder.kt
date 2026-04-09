package chat.rocket.reactnative.voip.signaling

import android.content.Context
import chat.rocket.reactnative.voip.VoipPayload
import org.json.JSONArray

/**
 * Interface for building call signal JSON arrays for DDP stream-notify-user.
 */
interface CallSignalBuilder {
    /**
     * Builds accept signal JSONArray.
     * @return JSONArray with [userId/media-calls, signalJson] or null if identity is missing
     */
    fun buildAcceptSignal(context: Context, payload: VoipPayload): JSONArray?

    /**
     * Builds reject signal JSONArray.
     * @return JSONArray with [userId/media-calls, signalJson] or null if identity is missing
     */
    fun buildRejectSignal(context: Context, payload: VoipPayload): JSONArray?
}
