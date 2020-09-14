//
//  Encryption.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/11/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import CommonCrypto
import class react_native_simple_crypto.RCTRsaUtils

struct Message: Decodable {
  let text: String
}

struct RoomKey: Decodable {
  let k: String
}

final class Encryption {
  static func readUserKey(mmkv: MMKV, server: String) -> String? {
    if let userKey = mmkv.string(forKey: "\(server)-RC_E2E_PRIVATE_KEY") {
      guard let json = try? JSONSerialization.jsonObject(with: userKey.data(using: .utf8)!, options: []) as? [String: Any] else {
        return nil
      }
      
      let utils = RCTRsaUtils()
      let k = NSMutableDictionary(dictionary: json)
      
      return utils.importKey(jwk: k)
    }
    
    return nil
  }
  
  static func decryptRoomKey(E2EKey: String, userKey: String) -> String? {
    let index = E2EKey.index(E2EKey.startIndex, offsetBy: 12)
    let roomKey = String(E2EKey[index...])
    
    let rsa = Rsa()
    rsa.privateKey = userKey
    let message = rsa.decrypt(roomKey)
    
    if let message = message?.data(using: .utf8) {
      if let key = try? (JSONDecoder().decode(RoomKey.self, from: message)) {
        // TODO: Extension to padding
        var base64Encoded = key.k.padding(toLength: ((key.k.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
        // Decode URL safe encoded base64
        base64Encoded = base64Encoded.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        return Shared.toHex(Data(base64Encoded: base64Encoded, options: .ignoreUnknownCharacters))
      }
    }
    
    return nil
  }
  
  static func decrypt(E2EKey: String, userKey: String, message: String) -> String {
    let index = message.index(message.startIndex, offsetBy: 12)
    let msg = String(message[index...])
    let base64Encoded = msg.padding(toLength: ((msg.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
    let data = Data(base64Encoded: base64Encoded, options: [])
    
    if let data = data {
      let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
      let cypher = data.subdata(in: kCCBlockSizeAES128..<data.count)
      if let key = decryptRoomKey(E2EKey: E2EKey, userKey: userKey) {
        let decrypted = Aes.aes128CBC("decrypt", data: cypher, key: key, iv: Shared.toHex(iv))
        if let decrypted = decrypted {
          if let m = try? (JSONDecoder().decode(Message.self, from: decrypted)) {
            return m.text
          }
        }
      }
    }
    
    // Fallback message
    return "Encrypted Message"
  }
}
