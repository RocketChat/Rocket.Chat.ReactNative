import Foundation
import CommonCrypto

/**
 * CallIdUUID - Converts a callId string to a deterministic UUID v5.
 * This is used by CallKit which requires UUIDs, while the server sends random callId strings.
 */
@objc(CallIdUUID)
final class CallIdUUID: NSObject {
    
    // Fixed namespace UUID for VoIP calls (RFC 4122 URL namespace)
    // Using the standard URL namespace UUID: 6ba7b811-9dad-11d1-80b4-00c04fd430c8
    private static let namespaceUUID: [UInt8] = [
        0x6b, 0xa7, 0xb8, 0x11,
        0x9d, 0xad,
        0x11, 0xd1,
        0x80, 0xb4,
        0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8
    ]
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    /**
     * Converts a callId string to a deterministic UUID v5 string.
     * Uses SHA-1 hash of namespace + callId, then formats as UUID v5.
     * This is a synchronous method for use from JavaScript.
     */
    @objc
    func toUUID(_ callId: String) -> String {
        return CallIdUUID.generateUUIDv5(from: callId)
    }
    
    /**
     * Static method for use in AppDelegate and other native code.
     * Generates a UUID v5 from a callId string.
     */
    static func generateUUIDv5(from callId: String) -> String {
        // Concatenate namespace UUID bytes with callId UTF-8 bytes
        var data = Data(namespaceUUID)
        data.append(callId.data(using: .utf8) ?? Data())
        
        // SHA-1 hash
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA1_DIGEST_LENGTH))
        data.withUnsafeBytes { dataBytes in
            _ = CC_SHA1(dataBytes.baseAddress, CC_LONG(data.count), &hash)
        }
        
        // Set version (4 bits) to 5 (0101)
        hash[6] = (hash[6] & 0x0F) | 0x50
        
        // Set variant (2 bits) to 10
        hash[8] = (hash[8] & 0x3F) | 0x80
        
        // Format as UUID string (only use first 16 bytes)
        let uuid = String(format: "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
                         hash[0], hash[1], hash[2], hash[3],
                         hash[4], hash[5],
                         hash[6], hash[7],
                         hash[8], hash[9],
                         hash[10], hash[11], hash[12], hash[13], hash[14], hash[15])
        
        return uuid
    }
}
