//
//  SendMessage.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/18/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

struct MessageBody: Codable {
  let message: Message
  
  struct Message: Codable {
    let _id: String
    let msg: String?
    let content: MessageContent?
    let rid: String
    let tmid: String?
    let t: MessageType?
  }
  
  struct MessageContent: Codable {
    let algorithm: String
    let ciphertext: String
  }
}

struct MessageResponse: Response {
  var success: Bool
}

final class SendMessageRequest: Request {
  typealias ResponseType = MessageResponse
  
  let method: HTTPMethod = .post
  let path = "/api/v1/chat.sendMessage"
  
  let id: String
  let roomId: String
  let text: String?
  let content: MessageBody.MessageContent?
  let messageType: MessageType?
  let threadIdentifier: String?
  
  init(id: String, roomId: String, text: String? = nil, content: MessageBody.MessageContent? = nil, threadIdentifier: String? = nil, messageType: MessageType? = nil) {
    self.id = id
    self.roomId = roomId
    self.text = text
    self.content = content
    self.messageType = messageType
    self.threadIdentifier = threadIdentifier
  }
  
  func body() -> Data? {
    return try? JSONEncoder().encode(MessageBody(message: MessageBody.Message(_id: id, msg: text, content: content, rid: roomId, tmid: threadIdentifier, t: messageType)))
  }
}
