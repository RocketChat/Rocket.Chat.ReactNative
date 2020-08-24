//
//  String+Hex.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 8/6/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

extension String {
    func toHex() -> String {
        return unicodeScalars.map{ .init($0.value, radix: 16, uppercase: false) }.joined()
    }
}
