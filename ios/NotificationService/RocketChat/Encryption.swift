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
  
  init(server: String, rid: String) {
    if let E2EKey = Database.shared.readRoomEncryptionKey(rid: rid, server: server), let userKey = readUserKey(server: server) {
      roomKey = decryptRoomKey(E2EKey: E2EKey, userKey: userKey)
    }
  }
  
  func readUserKey(server: String) -> String? {
    if let userKey = Storage.shared.getPrivateKey(server: server) {
      guard let json = try? JSONSerialization.jsonObject(with: userKey.data(using: .utf8)!, options: []) as? [String: Any] else {
        return nil
      }
      
      let utils = RCTRsaUtils()
      let k = NSMutableDictionary(dictionary: json)
      
      return utils.importKey(jwk: k)
    }
    
    return nil
  }
  
  func decryptRoomKey(E2EKey: String, userKey: String) -> String? {
    let index = E2EKey.index(E2EKey.startIndex, offsetBy: 12)
    let roomKey = String(E2EKey[index...])
    
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
    
    return nil
  }
  
  func decryptMessage(message: String) -> String {
    if let roomKey = self.roomKey {
      let index = message.index(message.startIndex, offsetBy: 12)
      let msg = String(message[index...])
      
      if let data = msg.toData() {
        let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
        let cypher = data.subdata(in: kCCBlockSizeAES128..<data.count)
        let decrypted = Aes.aes128CBC("decrypt", data: cypher, key: roomKey, iv: Shared.toHex(iv))
        if let decrypted = decrypted {
          if let m = try? (JSONDecoder().decode(Message.self, from: decrypted)) {
            return m.text
          }
        }
      }
    }
    
    return message
  }
}
