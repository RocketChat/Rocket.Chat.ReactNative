//
//  String+Extensions.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 8/6/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation

extension String {
  func toHex() -> String {
    return unicodeScalars.map{ .init($0.value, radix: 16, uppercase: false) }.joined()
  }
  
  func removeTrailingSlash() -> String {
    var url = self
    if (url.last == "/") {
      url.removeLast()
    }
    return url
  }
  
  static func random(length: Int) -> String {
    let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return String((0..<length).map{ _ in letters.randomElement()! })
  }
}
