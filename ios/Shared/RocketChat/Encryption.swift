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
  let algorithm: String
}

struct RoomKeyResult {
  let decryptedKey: String
  let algorithm: String
}

final class Encryption {
  final var roomKey: String? = nil
  final var keyId: String? = nil
  final var algorithm: String? = nil
  
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
        self.algorithm = result.algorithm
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
  
  private func parseMessage(content: EncryptedContent) -> ParsedMessage? {
    if content.algorithm == "rc.v2.aes-sha2" {
      guard let ciphertext = content.ciphertext as String?,
            let keyId = content.kid,
            let ivString = content.iv,
            let ivData = Data(base64Encoded: ivString) else {
        return nil
      }
      
      return ParsedMessage(keyId: keyId, iv: ivData, ciphertext: ciphertext, algorithm: "rc.v2.aes-sha2")
    } else {
      // V1 format: keyId + base64(iv + data)
      guard let ciphertext = content.ciphertext as String?, content.ciphertext.count > 12 else {
        return nil
      }
      
      let index = ciphertext.index(ciphertext.startIndex, offsetBy: 12)
      let keyId = String(ciphertext[..<index])
      let msg = String(ciphertext[index...])
      
      guard let data = msg.toData(), data.count > kCCBlockSizeAES128 else {
        return nil
      }
      
      let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
      let ciphertextData = data.subdata(in: kCCBlockSizeAES128..<data.count)
      let ciphertextWithoutPrefix = ciphertextData.base64EncodedString()
      
      return ParsedMessage(keyId: keyId, iv: iv, ciphertext: ciphertextWithoutPrefix, algorithm: "rc.v1.aes-sha2")
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
      return RoomKeyResult(decryptedKey: decryptedKey, algorithm: "rc.v2.aes-sha2")
    } else if let k = sessionKey["k"] as? String {
      // V1 format
      guard let base64Encoded = k.toData() else {
        return nil
      }
      let decryptedKey = CryptoUtils.bytes(toHex: base64Encoded)
      return RoomKeyResult(decryptedKey: decryptedKey, algorithm: "rc.v1.aes-sha2")
    }
    
    return nil
  }
    
  func decryptContent(content: EncryptedContent) -> String? {
    guard let roomKey = self.roomKey,
          let parsed = parseMessage(content: content),
          let kid = parsed.keyId as String?,
          let ivData = parsed.iv as Data?,
          let ciphertext = parsed.ciphertext as String? else {
      return nil
    }
    
    let ivHex = CryptoUtils.bytes(toHex: ivData)
    let decryptedBase64: String?
    
    if parsed.algorithm == "rc.v2.aes-sha2" {
      // Use AES-GCM decryption
      decryptedBase64 = AESCrypto.decryptGcmBase64(ciphertext, keyHex: roomKey, ivHex: ivHex)
    } else {
      // Use AES-CBC decryption
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
    // If decoding as DecryptedContent fails, try decoding as FallbackMessage
    else if let messageContent = try? JSONDecoder().decode(FallbackMessage.self, from: decryptedData) {
      return messageContent.text
    }
    
    return nil
  }
  
  func encryptContent(_ message: String) -> EncryptedContent? {
    guard let roomKey = roomKey,
          let keyId = keyId,
          let algorithm = algorithm else {
      return nil
    }
    
    let m = Message(msg: message)
    guard let cypherData = try? encoder.encode(m) else {
      return nil
    }
    
    let cypherBase64 = cypherData.base64EncodedString()
    
    if algorithm == "rc.v2.aes-sha2" {
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
        algorithm: algorithm,
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
        algorithm: algorithm,
        ciphertext: fullCiphertext,
        kid: nil,
        iv: nil
      )
    }
  }
}
