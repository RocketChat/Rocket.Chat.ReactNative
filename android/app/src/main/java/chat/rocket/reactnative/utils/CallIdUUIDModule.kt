package chat.rocket.reactnative.utils

import com.facebook.react.bridge.ReactApplicationContext
import java.security.MessageDigest

/**
 * CallIdUUID - Converts a callId string to a deterministic UUID v5.
 * This is used by CallKeep which requires UUIDs, while the server sends random callId strings.
 *
 * The algorithm matches the iOS implementation in CallIdUUID.swift to ensure
 * consistency across platforms.
 */
object CallIdUUID {

    // Fixed namespace UUID for VoIP calls (RFC 4122 URL namespace)
    // Using the standard URL namespace UUID: 6ba7b811-9dad-11d1-80b4-00c04fd430c8
    private val NAMESPACE_UUID = byteArrayOf(
        0x6b.toByte(), 0xa7.toByte(), 0xb8.toByte(), 0x11.toByte(),
        0x9d.toByte(), 0xad.toByte(),
        0x11.toByte(), 0xd1.toByte(),
        0x80.toByte(), 0xb4.toByte(),
        0x00.toByte(), 0xc0.toByte(), 0x4f.toByte(), 0xd4.toByte(), 0x30.toByte(), 0xc8.toByte()
    )

    /**
     * Generates a UUID v5 from a callId string.
     * Uses SHA-1 hash of namespace + callId, then formats as UUID v5.
     *
     * @param callId The call ID string to convert
     * @return A deterministic UUID string in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     */
    @JvmStatic
    fun generateUUIDv5(callId: String): String {
        // Concatenate namespace UUID bytes with callId UTF-8 bytes
        val callIdBytes = callId.toByteArray(Charsets.UTF_8)
        val data = ByteArray(NAMESPACE_UUID.size + callIdBytes.size)
        System.arraycopy(NAMESPACE_UUID, 0, data, 0, NAMESPACE_UUID.size)
        System.arraycopy(callIdBytes, 0, data, NAMESPACE_UUID.size, callIdBytes.size)

        // SHA-1 hash
        val md = MessageDigest.getInstance("SHA-1")
        val hash = md.digest(data)

        // Set version (4 bits) to 5 (0101)
        hash[6] = ((hash[6].toInt() and 0x0F) or 0x50).toByte()

        // Set variant (2 bits) to 10
        hash[8] = ((hash[8].toInt() and 0x3F) or 0x80).toByte()

        // Format as UUID string (only use first 16 bytes)
        return String.format(
            "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
            hash[0].toInt() and 0xFF, hash[1].toInt() and 0xFF, hash[2].toInt() and 0xFF, hash[3].toInt() and 0xFF,
            hash[4].toInt() and 0xFF, hash[5].toInt() and 0xFF,
            hash[6].toInt() and 0xFF, hash[7].toInt() and 0xFF,
            hash[8].toInt() and 0xFF, hash[9].toInt() and 0xFF,
            hash[10].toInt() and 0xFF, hash[11].toInt() and 0xFF, hash[12].toInt() and 0xFF,
            hash[13].toInt() and 0xFF, hash[14].toInt() and 0xFF, hash[15].toInt() and 0xFF
        )
    }
}

/**
 * React Native TurboModule implementation for CallIdUUID.
 * Exposes the CallIdUUID functionality to JavaScript.
 */
class CallIdUUIDModule(reactContext: ReactApplicationContext) : NativeCallIdUUIDSpec(reactContext) {

    override fun getName() = NativeCallIdUUIDSpec.NAME

    override fun toUUID(callId: String): String = CallIdUUID.generateUUIDv5(callId)
}