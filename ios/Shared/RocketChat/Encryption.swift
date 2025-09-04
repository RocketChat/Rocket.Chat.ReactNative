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

final class Encryption {
  final var roomKey: String? = nil
  final var keyId: String? = nil
  
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
  
  private final let encoder = JSONEncoder()
  
  init(server: String, rid: String) {
    let storage = Storage()
    self.privateKey = storage.getPrivateKey(server: server)
    self.credentials = storage.getCredentials(server: server)
    self.server = server
    self.rid = rid
    
    if let E2EKey = Database(server: server).readRoomEncryptionKey(for: rid) {
      self.roomKey = decryptRoomKey(E2EKey: E2EKey)
    }
  }
  
  func decryptRoomKey(E2EKey: String) -> String? {
    if let userKey = userKey {
      let index = E2EKey.index(E2EKey.startIndex, offsetBy: 12)
      let roomKey = String(E2EKey[index...])
      keyId = String(E2EKey[..<index])
      
      if let decryptedMessage = RSACrypto.decrypt(roomKey, privateKeyPem: userKey) {
        if let messageData = decryptedMessage.data(using: .utf8) {
          if let key = try? JSONDecoder().decode(RoomKey.self, from: messageData) {
            if let base64Encoded = key.k.toData() {
              return CryptoUtils.bytes(toHex: base64Encoded)
            }
          }
        }
      }
    }
    
    return nil
  }
  
  func decryptMessage(message: String) -> String? {
    if let roomKey = self.roomKey {
      let index = message.index(message.startIndex, offsetBy: 12)
      let msg = String(message[index...])
      if let data = msg.toData() {
        let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
        let cypher = data.subdata(in: kCCBlockSizeAES128..<data.count)
        
        let cypherBase64 = cypher.base64EncodedString()
        let ivHex = CryptoUtils.bytes(toHex: iv)
        
        if let decryptedBase64 = AESCrypto.decryptBase64(cypherBase64, keyHex: roomKey, ivHex: ivHex),
           let decryptedData = Data(base64Encoded: decryptedBase64) {
          // First try decoding as DecryptedContent
          if let decryptedContent = try? JSONDecoder().decode(DecryptedContent.self, from: decryptedData) {
            return decryptedContent.msg
          }
          // If decoding as DecryptedContent fails, try decoding as Message
          else if let messageContent = try? JSONDecoder().decode(Message.self, from: decryptedData) {
            return messageContent.text
          }
        }
      }
    }
    
    return nil
  }
  
  func encryptMessage(id: String, message: String) -> String {
    if let userId = credentials?.userId, let roomKey = roomKey {
      let m = Message(_id: id, text: message, userId: userId)
      if let cypherData = try? encoder.encode(m) {
        let cypherBase64 = cypherData.base64EncodedString()
        
        if let randomBytesHex = RandomUtils.generateRandomKeyHex(UInt(kCCBlockSizeAES128)),
           let iv = Data(hexString: randomBytesHex) {
          let ivHex = CryptoUtils.bytes(toHex: iv)
          
          if let encryptedBase64 = AESCrypto.encryptBase64(cypherBase64, keyHex: roomKey, ivHex: ivHex),
             let encryptedData = Data(base64Encoded: encryptedBase64),
             let keyId = keyId {
            let joined = Data.join(vector: iv, data: encryptedData)
            return keyId + joined.base64EncodedString()
          }
        }
      }
    }
    
    return message
  }
}
