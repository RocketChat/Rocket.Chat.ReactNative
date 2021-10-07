//
//  MessageType.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

enum MessageType: String, Codable {
  case e2e
  case unknown

  public init(from decoder: Decoder) throws {
    guard let rawValue = try? decoder.singleValueContainer().decode(String.self) else {
      self = .unknown
      return
    }
    
    self = MessageType(rawValue: rawValue) ?? .unknown
  }
}
