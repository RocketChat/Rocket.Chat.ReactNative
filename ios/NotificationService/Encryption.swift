//
//  Encryption.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/11/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import CommonCrypto

struct Message: Decodable {
  let text: String
}

struct RoomKey: Decodable {
  let k: String
}

final class Encryption {
  static let privateKey = ""

  static func decryptRoomKey(rid: String) -> String {
    let E2EKey = ""

    let index = E2EKey.index(E2EKey.startIndex, offsetBy: 12)
    let roomKey = String(E2EKey[index...])
    
    let rsa = Rsa()
    rsa.privateKey = privateKey
    let message = rsa.decrypt(roomKey)

    if let message = message?.data(using: .utf8) {
        if let key = try? (JSONDecoder().decode(RoomKey.self, from: message)) {
            // TODO: Extension to padding
            return Shared.toHex(Data(base64Encoded: "\(key.k)==", options: .ignoreUnknownCharacters))
        }
    }
    
    return ""
  }

  static func decrypt(rid: String, message: String) -> String {
    let index = message.index(message.startIndex, offsetBy: 12)
    let msg = String(message[index...])
    let data = Data(base64Encoded: msg, options: [])
    
    if let data = data {
        let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
        let cypher = data.subdata(in: kCCBlockSizeAES128..<data.count)
        let key = decryptRoomKey(rid: rid)
        let decrypted = Aes.aes128CBC("decrypt", data: cypher, key: key, iv: Shared.toHex(iv))
      
        if let decrypted = decrypted {
            if let m = try? (JSONDecoder().decode(Message.self, from: decrypted)) {
                return m.text
            }
        }
    }
    
    // Fallback message
    return "Encrypted Message"
  }
}
