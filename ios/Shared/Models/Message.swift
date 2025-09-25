//
//  Message.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct Message: Codable {
  let _id: String
  let text: String
  let userId: String
  let ts: Date
  
  init(_id: String, text: String, userId: String) {
    self._id = _id
    self.text = text
    self.userId = userId
    self.ts = Date()
  }
}