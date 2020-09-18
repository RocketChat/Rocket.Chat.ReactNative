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
  let ts: Int64 = Date().currentTimeMillis()
}
