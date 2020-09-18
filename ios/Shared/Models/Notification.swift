//
//  Notification.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

struct Notification: Decodable {
  let notId: Int
  let title: String
  let text: String
  let payload: Payload
}
