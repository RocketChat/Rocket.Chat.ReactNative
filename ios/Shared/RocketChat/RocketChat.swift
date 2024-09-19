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
    
    var msg = message
    let encrypted = Database(server: server).readRoomEncrypted(for: rid)
    if encrypted {
      msg = encryptMessage(rid: rid, id: id, message: message)
    }
    
    api?.fetch(request: SendMessageRequest(id: id, roomId: rid, text: msg, threadIdentifier: threadIdentifier, messageType: encrypted ? .e2e : nil )) { response in
      switch response {
      case .resource(let response):
        completion(response)
        
      case .error:
        completion(nil)
        break
      }
    }
  }
  
  func decryptMessage(rid: String, message: String) -> String? {
    encryptionQueue.sync {
      let encryption = Encryption(server: server, rid: rid)
      return encryption.decryptMessage(message: message)
    }
  }
  
  func encryptMessage(rid: String, id: String, message: String) -> String {
    encryptionQueue.sync {
      let encryption = Encryption(server: server, rid: rid)
      return encryption.encryptMessage(id: id, message: message)
    }
  }
}
