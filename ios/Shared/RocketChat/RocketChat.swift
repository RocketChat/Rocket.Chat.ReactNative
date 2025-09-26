//
//  RocketChat.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/17/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

final class RocketChat {
  typealias Server = String
  typealias RoomId = String
  
  let server: Server
  let api: API?

  private var encryptionQueue = DispatchQueue(label: "chat.rocket.encryptionQueue")
  
  init(server: Server) {
    self.server = server
    self.api = API(server: server)
  }
  
  func getPushWithId(_ msgId: String, completion: @escaping((Notification?) -> Void)) {
    api?.fetch(request: PushRequest(msgId: msgId), retry: Retry(retries: 4)) { response in
      switch response {
      case .resource(let response):
        let notification = response.data.notification
        completion(notification)
        
      case .error:
        completion(nil)
        break
      }
    }
  }
  
  func sendMessage(rid: String, message: String, threadIdentifier: String?, completion: @escaping((MessageResponse?) -> Void)) {
    let id = String.random(length: 17)
    
    let encrypted = Database(server: server).readRoomEncrypted(for: rid)
    
    if encrypted {
      let encryption = Encryption(server: server, rid: rid)
      guard let content = encryption.encryptMessageContent(id: id, message: message) else {
        // Fallback to unencrypted if encryption fails
        api?.fetch(request: SendMessageRequest(id: id, roomId: rid, text: message, threadIdentifier: threadIdentifier, messageType: nil)) { response in
          switch response {
          case .resource(let response):
            completion(response)
          case .error:
            completion(nil)
            break
          }
        }
        return
      }
      
      // Create content structure similar to TypeScript
      let messageContent: MessageBody.MessageContent
      if content.algorithm == "rc.v2.aes-sha2" {
        messageContent = MessageBody.MessageContent(
          algorithm: content.algorithm,
          ciphertext: content.ciphertext,
          kid: content.kid,
          iv: content.iv
        )
      } else {
        messageContent = MessageBody.MessageContent(
          algorithm: content.algorithm,
          ciphertext: content.ciphertext
        )
      }
      
      // For backward compatibility, also set msg field
      let msg = content.algorithm == "rc.v2.aes-sha2" 
        ? encryption.encryptMessage(id: id, message: message) // JSON string for v2
        : content.ciphertext // Direct ciphertext for v1
      
      api?.fetch(request: SendMessageRequest(id: id, roomId: rid, text: msg, content: messageContent, threadIdentifier: threadIdentifier, messageType: .e2e)) { response in
        switch response {
        case .resource(let response):
          completion(response)
          
        case .error:
          completion(nil)
          break
        }
      }
    } else {
      api?.fetch(request: SendMessageRequest(id: id, roomId: rid, text: message, threadIdentifier: threadIdentifier, messageType: nil)) { response in
        switch response {
        case .resource(let response):
          completion(response)
          
        case .error:
          completion(nil)
          break
        }
      }
    }
  }
  
  func decryptMessage(rid: String, message: String) -> String? {
    encryptionQueue.sync {
      let encryption = Encryption(server: server, rid: rid)
      return encryption.decryptMessage(message: message)
    }
  }
  
  func decryptContent(rid: String, algorithm: String, kid: String, iv: String, ciphertext: String) -> String? {
    encryptionQueue.sync {
      let encryption = Encryption(server: server, rid: rid)
      return encryption.decryptContent(algorithm: algorithm, kid: kid, iv: iv, ciphertext: ciphertext)
    }
  }
  
  func encryptMessage(rid: String, id: String, message: String) -> String {
    encryptionQueue.sync {
      let encryption = Encryption(server: server, rid: rid)
      return encryption.encryptMessage(id: id, message: message)
    }
  }
  
}
