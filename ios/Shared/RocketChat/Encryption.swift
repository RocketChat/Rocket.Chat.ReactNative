//
//  Encryption.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/11/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import CommonCrypto
import class react_native_simple_crypto.RCTRsaUtils

final class Encryption {
  final var roomKey: String? = nil
  final var keyId: String? = nil
  
  private let privateKey: String?
  private let credentials: Credentials?
  private let server: String
  private let rid: String
  
  private var userKey: String? {
    if let userKey = self.privateKey {
      guard let json = try? JSONSerialization.jsonObject(with: userKey.data(using: .utf8)!, options: []) as? [String: Any] else {
        return nil
      }
      
      let utils = RCTRsaUtils()
      let k = NSMutableDictionary(dictionary: json)
      
      return utils.importKey(jwk: k)
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
      
      let rsa = Rsa()
      rsa.privateKey = userKey
      let message = rsa.decrypt(roomKey)
      
      if let message = message?.data(using: .utf8) {
        if let key = try? (JSONDecoder().decode(RoomKey.self, from: message)) {
          if let base64Encoded = key.k.toData() {
            return Shared.toHex(base64Encoded)
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
        if let decrypted = Aes.aes128CBC("decrypt", data: cypher, key: roomKey, iv: Shared.toHex(iv)) {
            // First try decoding as DecryptedContent
            if let decryptedContent = try? JSONDecoder().decode(DecryptedContent.self, from: decrypted) {
                return decryptedContent.msg
            }
            // If decoding as DecryptedContent fails, try decoding as Message
            else if let messageContent = try? JSONDecoder().decode(Message.self, from: decrypted) {
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
      let iv = Data.randomBytes(length: kCCBlockSizeAES128)
      let cypher = try? encoder.encode(m)
      if let keyId = keyId, let cypher = cypher, let data = Aes.aes128CBC("encrypt", data: cypher, key: roomKey, iv: Shared.toHex(iv)) {
        let joined = Data.join(vector: iv, data: data)
        return keyId + joined.base64EncodedString()
      }
    }
    
    return message
  }
}
