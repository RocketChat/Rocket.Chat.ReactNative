//
//  Data+Extensions.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/18/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

extension Data {
  static func randomBytes(length: Int) -> Data {
    let bytes = [UInt32](repeating: 0, count: length).map { _ in arc4random() }
    let data = Data(bytes: bytes, count: length)
    return data
  }
  
  static func join(vector: Data, data: Data) -> Data {
    var v = vector
    v.append(data)
    return v
  }
  
  init?(hexString: String) {
    let len = hexString.count / 2
    var data = Data(capacity: len)
    var i = hexString.startIndex
    for _ in 0..<len {
      let j = hexString.index(i, offsetBy: 2)
      let bytes = hexString[i..<j]
      if var num = UInt8(bytes, radix: 16) {
        data.append(&num, count: 1)
      } else {
        return nil
      }
      i = j
    }
    self = data
  }
}
