//
//  EncryptedContent.swift
//  RocketChatRN
//
//  Created by Diego Mello on 9/13/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Foundation

struct EncryptedContent: Codable {
    let algorithm: String
    let ciphertext: String
}
