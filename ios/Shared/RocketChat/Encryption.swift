//
//  Encryption.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/11/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import CommonCrypto
import MobileCrypto

// MARK: - Helper Structs
struct PrefixedData {
    let prefix: String
    let data: Data
}

struct ParsedMessage {
    let keyId: String
    let iv: Data
    let ciphertext: String
    let isV2: Bool
}

struct RoomKeyResult {
    let decryptedKey: String
    let version: String
}

final class Encryption {
  final var roomKey: String? = nil
  final var keyId: String? = nil
  final var version: String? = nil
  
  private let privateKey: String?
  private let credentials: Credentials?
  private let server: String
  private let rid: String
  
  private var userKey: String? {
    if let privateKeyJson = self.privateKey {
      guard let json = try? JSONSerialization.jsonObject(with: privateKeyJson.data(using: .utf8)!, options: []) as? [String: Any] else {
        return nil
      }
      
      return RSACrypto.importJwkKey(json)
    }
    
    return nil
  }
  
  private final let encoder: JSONEncoder = {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    return encoder
  }()
  
  init(server: String, rid: String) {
    let storage = Storage()
    self.privateKey = storage.getPrivateKey(server: server)
    self.credentials = storage.getCredentials(server: server)
    self.server = server
    self.rid = rid
    
    if let E2EKey = Database(server: server).readRoomEncryptionKey(for: rid) {
      if let result = decryptRoomKey(E2EKey: E2EKey) {
        self.roomKey = result.decryptedKey
        self.version = result.version
      }
    }
  }
  
  // MARK: - Utility Functions
  private func decodePrefixedBase64(_ input: String) -> PrefixedData? {
    // A 256-byte array always encodes to 344 characters in Base64.
    let encodedLength = 344
    
    guard input.count >= encodedLength else {
      return nil
    }
    
    let endIndex = input.index(input.endIndex, offsetBy: -encodedLength)
    let prefix = String(input[..<endIndex])
    let base64Data = String(input[endIndex...])
    
    guard let data = Data(base64Encoded: base64Data), data.count == 256 else {
      return nil
    }
    
    return PrefixedData(prefix: prefix, data: data)
  }
  
  private func encodePrefixedBase64(_ prefix: String, _ data: Data) -> String? {
    guard data.count == 256 else {
      return nil
    }
    
    let base64Data = data.base64EncodedString()
    return prefix + base64Data
  }
  
  private func parseMessage(_ payload: String) -> ParsedMessage? {
    if payload.hasPrefix("{") {
      // V2 format: JSON structure
      guard let data = payload.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
            let keyId = json["kid"] as? String,
            let ivString = json["iv"] as? String,
            let ciphertext = json["ciphertext"] as? String,
            let ivData = Data(base64Encoded: ivString) else {
        return nil
      }
      
      return ParsedMessage(keyId: keyId, iv: ivData, ciphertext: ciphertext, isV2: true)
    } else {
      // V1 format: keyId + base64(iv + data)
      guard payload.count > 12 else {
        return nil
      }
      
      let index = payload.index(payload.startIndex, offsetBy: 12)
      let keyId = String(payload[..<index])
      let msg = String(payload[index...])
      
      guard let data = msg.toData(), data.count > kCCBlockSizeAES128 else {
        return nil
      }
      
      let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
      let cypherData = data.subdata(in: kCCBlockSizeAES128..<data.count)
      let ciphertext = cypherData.base64EncodedString()
      
      return ParsedMessage(keyId: keyId, iv: iv, ciphertext: ciphertext, isV2: false)
    }
  }
  
  func decryptRoomKey(E2EKey: String) -> RoomKeyResult? {
    guard let userKey = userKey else {
      return nil
    }
    
    // Parse using prefixed base64
    guard let parsed = decodePrefixedBase64(E2EKey) else {
      return nil
    }
    
    keyId = parsed.prefix
    
    // Decrypt the session key
    guard let decryptedMessage = RSACrypto.decrypt(parsed.data.base64EncodedString(), privateKeyPem: userKey),
          let messageData = decryptedMessage.data(using: .utf8),
          let sessionKey = try? JSONSerialization.jsonObject(with: messageData, options: []) as? [String: Any] else {
      return nil
    }
    
    // Determine format and extract key information
    if let k = sessionKey["k"] as? String,
      let alg = sessionKey["alg"] as? String, alg == "A256GCM" {
      // V2 format
      guard let base64Encoded = k.toData() else {
        return nil
      }
      let decryptedKey = CryptoUtils.bytes(toHex: base64Encoded)
      return RoomKeyResult(decryptedKey: decryptedKey, version: "v2")
    } else if let k = sessionKey["k"] as? String {
      // V1 format
      guard let base64Encoded = k.toData() else {
        return nil
      }
      let decryptedKey = CryptoUtils.bytes(toHex: base64Encoded)
      return RoomKeyResult(decryptedKey: decryptedKey, version: "v1")
    }
    
    return nil
  }
  
  func decryptMessage(message: String) -> String? {
    guard let roomKey = self.roomKey,
          let parsed = parseMessage(message) else {
      return nil
    }
    
    return decryptWithParsedData(keyId: parsed.keyId, iv: parsed.iv, ciphertext: parsed.ciphertext, isV2: parsed.isV2, roomKey: roomKey)
  }
  
  // Helper method to decrypt with already parsed components
  private func decryptWithParsedData(keyId: String, iv: Data, ciphertext: String, isV2: Bool, roomKey: String) -> String? {
    let ivHex = CryptoUtils.bytes(toHex: iv)
    let decryptedBase64: String?
    
    if isV2 {
      // Use AES-GCM decryption for v2
      decryptedBase64 = AESCrypto.decryptGcmBase64(ciphertext, keyHex: roomKey, ivHex: ivHex)
    } else {
      // Use AES-CBC decryption for v1 (existing logic)
      decryptedBase64 = AESCrypto.decryptBase64(ciphertext, keyHex: roomKey, ivHex: ivHex)
    }
    
    guard let decryptedBase64 = decryptedBase64,
          let decryptedData = Data(base64Encoded: decryptedBase64) else {
      return nil
    }
    
    // First try decoding as DecryptedContent
    if let decryptedContent = try? JSONDecoder().decode(DecryptedContent.self, from: decryptedData) {
      return decryptedContent.msg
    }
    // If decoding as DecryptedContent fails, try decoding as Message
    else if let messageContent = try? JSONDecoder().decode(OldMessage.self, from: decryptedData) {
      return messageContent.text
    }
    
    return nil
  }
  
  func decryptContent(algorithm: String, kid: String, iv: String, ciphertext: String) -> String? {
    guard let roomKey = self.roomKey,
          let ivData = Data(base64Encoded: iv) else {
      return nil
    }
    
    let isV2 = algorithm == "rc.v2.aes-sha2"
    return decryptWithParsedData(keyId: kid, iv: ivData, ciphertext: ciphertext, isV2: isV2, roomKey: roomKey)
  }
  
  func encryptMessageContent(_ message: String) -> EncryptedContent? {
    guard let roomKey = roomKey,
          let keyId = keyId,
          let version = version else {
      return nil
    }
    
    let m = Message(msg: message)
    guard let cypherData = try? encoder.encode(m) else {
      return nil
    }
    
    let cypherBase64 = cypherData.base64EncodedString()
    
    if version == "v2" {
      // V2 format: Use AES-GCM with 12-byte IV
      guard let randomBytesHex = RandomUtils.generateRandomKeyHex(12),
            let iv = Data(hexString: randomBytesHex) else {
        return nil
      }
      
      let ivHex = CryptoUtils.bytes(toHex: iv)
      
      guard let encryptedBase64 = AESCrypto.encryptGcmBase64(cypherBase64, keyHex: roomKey, ivHex: ivHex) else {
        return nil
      }
      
      return EncryptedContent(
        algorithm: "rc.v2.aes-sha2",
        ciphertext: encryptedBase64,
        kid: keyId,
        iv: iv.base64EncodedString()
      )
    } else {
      // V1 format: Use AES-CBC with 16-byte IV
      guard let randomBytesHex = RandomUtils.generateRandomKeyHex(UInt(kCCBlockSizeAES128)),
            let iv = Data(hexString: randomBytesHex) else {
        return nil
      }
      
      let ivHex = CryptoUtils.bytes(toHex: iv)
      
      guard let encryptedBase64 = AESCrypto.encryptBase64(cypherBase64, keyHex: roomKey, ivHex: ivHex),
            let encryptedData = Data(base64Encoded: encryptedBase64) else {
        return nil
      }
      
      let joined = Data.join(vector: iv, data: encryptedData)
      let fullCiphertext = keyId + joined.base64EncodedString()
      
      return EncryptedContent(
        algorithm: "rc.v1.aes-sha2",
        ciphertext: fullCiphertext,
        kid: nil,
        iv: nil
      )
    }
  }
}
