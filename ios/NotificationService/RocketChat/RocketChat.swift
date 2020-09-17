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
  
  func decryptMessage(rid: String, message: String) -> String? {
    if let encryption = encryptionInstances[rid] {
      return encryption.decryptMessage(message: message)
    }
    
    let encryption = Encryption(server: server, rid: rid)
    encryptionInstances[rid] = encryption
    return encryption.decryptMessage(message: message)
  }
}
