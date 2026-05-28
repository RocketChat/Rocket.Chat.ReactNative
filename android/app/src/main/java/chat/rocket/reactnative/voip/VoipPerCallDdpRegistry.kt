package chat.rocket.reactnative.voip

/**
 * Per-call DDP client slots: each [callId] maps to at most one [DDPClient] in production.
 * Isolates teardown so a busy-call reject (call B) does not disconnect call A's listener.
 */
internal class VoipPerCallDdpRegistry<T : Any>(
    private val releaseClient: (T) -> Unit
) {
    private val lock = Any()
    private val clients = mutableMapOf<String, T>()
    private val loggedInCallIds = mutableSetOf<String>()

    fun clientFor(callId: String): T? = synchronized(lock) { clients[callId] }

    fun isLoggedIn(callId: String): Boolean = synchronized(lock) { loggedInCallIds.contains(callId) }

    fun putClient(callId: String, client: T) {
        synchronized(lock) {
            clients.remove(callId)?.let(releaseClient)
            clients[callId] = client
            loggedInCallIds.remove(callId)
        }
    }

    fun markLoggedIn(callId: String) {
        synchronized(lock) {
            loggedInCallIds.add(callId)
        }
    }

    fun stopClient(callId: String) {
        synchronized(lock) {
            loggedInCallIds.remove(callId)
            clients.remove(callId)?.let(releaseClient)
        }
    }

    fun stopAllClients() {
        synchronized(lock) {
            loggedInCallIds.clear()
            clients.values.forEach(releaseClient)
            clients.clear()
        }
    }

    fun clientCount(): Int = synchronized(lock) { clients.size }

    fun clientIds(): Set<String> = synchronized(lock) { clients.keys.toSet() }
}
