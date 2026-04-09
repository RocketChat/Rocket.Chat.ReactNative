package chat.rocket.reactnative.voip.credentials

/**
 * Placeholder interface for Slice 3 implementation.
 * Slice 1 requires this to exist so DdpClientFactory compiles.
 * Slice 3 will provide the full implementation.
 */
interface VoipCredentialsProvider {
    fun userId(): String?
    fun token(): String?
    fun deviceId(): String
}
