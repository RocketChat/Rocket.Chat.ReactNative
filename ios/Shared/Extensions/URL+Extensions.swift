//
//  URL+Extensions.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/15/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

extension URL {
  var domain: String? {
    if let host = self.host {
      if let port = self.port {
        return "\(host):\(port)"
      }
      return host
    }
    
    return nil
  }
}

