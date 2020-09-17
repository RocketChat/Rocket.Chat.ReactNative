//
//  Response.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/16/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

protocol Response: Decodable {
  var success: Bool { get }
}

enum APIResponse<T: Response> {
    case resource(T)
    case error
}
