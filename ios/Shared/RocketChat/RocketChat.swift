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
  
  static var instances: [Server: RocketChat] = [:]
  var encryptionInstances: [RoomId: Encryption] = [:]
  
  static private var queue = DispatchQueue(label: "chat.rocket.instanceQueue")
  private var encryptionQueue = DispatchQueue(label: "chat.rocket.encryptionQueue")
  
  init(server: Server) {
    self.server = server
    self.api = API(server: server)
  }
  
  static func instanceForServer(server: Server) -> RocketChat {
    queue.sync {
      if let rocketchat = instances[server] {
        return rocketchat
      }
      
      let rocketchat = RocketChat(server: server)
      instances[server] = rocketchat
      return rocketchat
    }
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
  
  func sendMessage(rid: String, message: String, completion: @escaping((MessageResponse?) -> Void)) {
    let id = String.random(length: 17)
    
    var msg = message
    let encrypted = Database(server: server).readRoomEncrypted(rid: rid)
    if encrypted {
      msg = encryptMessage(rid: rid, id: id, message: message)
    }
    
    api?.fetch(request: SendMessageRequest(id: id, roomId: rid, text: msg, messageType: encrypted ? .e2e : nil )) { response in
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
      if let encryption = encryptionInstances[rid] {
        return encryption.decryptMessage(message: message)
      }
      
      let encryption = Encryption(server: server, rid: rid)
      encryptionInstances[rid] = encryption
      return encryption.decryptMessage(message: message)
    }
  }
  
  func encryptMessage(rid: String, id: String, message: String) -> String {
    encryptionQueue.sync {
      if let encryption = encryptionInstances[rid] {
        return encryption.encryptMessage(id: id, message: message)
      }
      
      let encryption = Encryption(server: server, rid: rid)
      encryptionInstances[rid] = encryption
      return encryption.encryptMessage(id: id, message: message)
    }
  }
}
