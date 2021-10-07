//
//  Date+Extensions.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/18/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

extension Date {
    func currentTimeMillis() -> Int64 {
        return Int64(self.timeIntervalSince1970 * 1000)
    }
}
