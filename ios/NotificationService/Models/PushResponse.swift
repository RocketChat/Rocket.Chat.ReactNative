//
//  PushResponse.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct PushResponse: Response {
  let success: Bool
  let data: Data
  
  struct Data: Decodable {
    let notification: Notification
  }
}
