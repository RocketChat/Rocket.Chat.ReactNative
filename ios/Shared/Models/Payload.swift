//
//  Payload.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct Caller: Codable {
  let _id: String?
  let name: String?
  let username: String?
}

struct Payload: Codable {
  let host: String
  let rid: String?
  let type: RoomType?
  let sender: Sender?
  let messageId: String?
  let notificationType: NotificationType?
  let name: String?
  let fname: String?
  let messageType: MessageType?
  let msg: String?
  let senderName: String?
  let tmid: String?
  let prid: String?
  let content: EncryptedContent?
  
  // Video conference fields
  let caller: Caller?
  let callId: String?
  let status: Int?
}
