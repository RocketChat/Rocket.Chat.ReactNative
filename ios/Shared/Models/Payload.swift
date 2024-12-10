//
//  Payload.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct Payload: Codable {
  let host: String
  let rid: String?
  let type: RoomType?
  let sender: Sender?
  let messageId: String
  let notificationType: NotificationType?
  let name: String?
  let messageType: MessageType?
  let msg: String?
  let senderName: String?
  let tmid: String?
  let content: EncryptedContent?
}
