//
//  RoomType.swift
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/22/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

enum RoomType: String, Codable {
  case direct = "d"
  case group = "p"
  case channel = "c"
  case livechat = "l"
}
