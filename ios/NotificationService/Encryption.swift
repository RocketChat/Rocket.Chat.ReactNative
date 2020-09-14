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

final class Encryption {
  static func decrypt(message: String) -> String {
    let index = message.index(message.startIndex, offsetBy: 12)
    let msg = String(message[index...])
    let data = Data(base64Encoded: msg, options: [])
    
    if let data = data {
        let iv = data.subdata(in: 0..<kCCBlockSizeAES128)
        let cypher = data.subdata(in: kCCBlockSizeAES128..<data.count)
        let key = "12ca2b3a4e5849c109897e1117a4ee40" // Shared.toHex(Data(base64Encoded: "EsorOk5YScEJiX4RF6TuQA"))
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
