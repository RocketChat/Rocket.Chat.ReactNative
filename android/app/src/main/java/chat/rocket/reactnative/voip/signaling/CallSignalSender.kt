package chat.rocket.reactnative.voip.signaling

import android.content.Context
import chat.rocket.reactnative.voip.VoipPayload

/**
 * Interface for sending call accept/reject signals via DDP.
 */
interface CallSignalSender {
    /**
     * Sends accept signal synchronously via callMethod.
     */
    fun sendAccept(context: Context, payload: VoipPayload, onComplete: (Boolean) -> Unit)

    /**
     * Queues accept signal via queueMethodCall when not connected.
     */
    fun queueAccept(context: Context, payload: VoipPayload, onComplete: (Boolean) -> Unit)

    /**
     * Sends reject signal synchronously via callMethod.
     */
    fun sendReject(context: Context, payload: VoipPayload)

    /**
     * Queues reject signal via queueMethodCall when not connected.
     */
    fun queueReject(context: Context, payload: VoipPayload)

    /**
     * Flushes any signals that were queued before DDP connection was established.
     * Called after login completes.
     * @return true if there were queued signals to flush
     */
    fun flushPendingQueuedSignalsIfNeeded(callId: String): Boolean
}
