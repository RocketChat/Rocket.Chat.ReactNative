//
//  Encryption.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/11/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import MobileCryptoCore
import Security

// MARK: - Helper Structs
struct PrefixedData {
  let prefix: String
  let data: Data
}

struct RoomKeyResult {
  let decryptedKey: AESKey
  let algorithm: String
}

final class Encryption {
  final var roomKey: AESKey? = nil
  final var keyId: String? = nil
  final var algorithm: String? = nil
  
  private let privateKey: String?
  private let credentials: Credentials?
  private let server: String
  private let rid: String
  
  private var userKey: SecKey? {
    privateKey.flatMap { MobileCryptoNative.rsaImportPrivateKey($0) }
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
    guard let decryptedMessage = MobileCryptoNative.rsaDecrypt(parsed.data.base64EncodedString(), privateKey: userKey),
          let messageData = decryptedMessage.data(using: .utf8),
          let sessionKey = try? JSONSerialization.jsonObject(with: messageData, options: []) as? [String: Any],
          let k = sessionKey["k"] as? String,
          let decryptedKey = MobileCryptoNative.aesImportKey(k) else {
      return nil
    }
    
    let isV2 = sessionKey["alg"] as? String == "A256GCM"
    return RoomKeyResult(decryptedKey: decryptedKey, algorithm: isV2 ? "rc.v2.aes-sha2" : "rc.v1.aes-sha2")
  }
    
  func decryptContent(content: EncryptedContent) -> String? {
    guard let roomKey = self.roomKey else {
      return nil
    }
    
    let decryptedText: String?
    if content.algorithm == "rc.v2.aes-sha2" {
      guard let iv = content.iv else {
        return nil
      }
      decryptedText = MobileCryptoNative.aesGcmDecrypt(content.ciphertext, iv: iv, key: roomKey)
    } else {
      guard content.ciphertext.count > 12 else {
        return nil
      }
      decryptedText = MobileCryptoNative.aesCbcDecrypt(String(content.ciphertext.dropFirst(12)), key: roomKey)
    }
    
    guard let decryptedData = decryptedText?.data(using: .utf8) else {
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
    guard let cypherData = try? encoder.encode(m),
          let plaintext = String(data: cypherData, encoding: .utf8) else {
      return nil
    }
    
    if algorithm == "rc.v2.aes-sha2" {
      guard let encrypted = MobileCryptoNative.aesGcmEncrypt(plaintext, key: roomKey) else {
        return nil
      }
      
      return EncryptedContent(
        algorithm: algorithm,
        ciphertext: encrypted.ciphertext,
        kid: keyId,
        iv: encrypted.iv
      )
    }
    
    guard let ivAndCiphertext = MobileCryptoNative.aesCbcEncrypt(plaintext, key: roomKey) else {
      return nil
    }
    
    return EncryptedContent(
      algorithm: algorithm,
      ciphertext: keyId + ivAndCiphertext,
      kid: nil,
      iv: nil
    )
  }
}
