//
//  Watermelon.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/14/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import WatermelonDB

class Database {
  final var driver: DatabaseDriver? = nil
  
  init(server: String) {
    let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as! String
    guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) else {
      return
    }
    
    if let url = URL(string: server) {
      let scheme = url.scheme ?? ""
      let domain = url.absoluteString.replacingOccurrences(of: "\(scheme)://", with: "")
      
      if let driver = try? DatabaseDriver(dbName: "\(directory.path)/\(domain).db", schemaVersion: 10) {
        self.driver = driver
      }
    }
  }
  
  func readRoomEncryptionKey(rid: String) -> String? {
    if let room = (try? self.driver?.find(table: "subscriptions", id: rid)) as? [String : Any] {
      if let encryptionKey = room["e2e_key"] as? String {
        return encryptionKey
      }
    }
    
    return nil
  }
}
