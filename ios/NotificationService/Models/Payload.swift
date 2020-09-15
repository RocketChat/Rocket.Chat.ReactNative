//
//  Payload.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

struct Payload: Codable {
  let host: String
  let rid: String?
  let type: String?
  let sender: Sender?
  let messageId: String
  let notificationType: String?
  let name: String?
  let messageType: String?
  let msg: String?
}
