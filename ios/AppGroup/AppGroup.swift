//
//  AppGroup.swift
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 8/31/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

@objc(AppGroup)
class AppGroup: NSObject {

  @objc
  func constantsToExport() -> [AnyHashable : Any]! {
    // Get App Group directory
    var path = ""
    var suiteName = ""
    
    let suite = Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier") as? String
      ?? Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String
    if let suite = suite {
      suiteName = suite
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) {
        path = directory.path
      }
    }

    return ["path": "\(path)/", "suiteName": suiteName]
  }
}
