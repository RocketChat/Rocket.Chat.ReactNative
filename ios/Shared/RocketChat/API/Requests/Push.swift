//
//  Push.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

final class PushRequest: Request {
  var query: String?
  
  typealias ResponseType = PushResponse
  
  let path = "/api/v1/push.get"
  
  init(msgId: String) {
    self.query = "id=\(msgId)"
  }
}
