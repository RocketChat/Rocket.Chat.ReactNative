//
//  Watermelon.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/14/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import WatermelonDB

struct Room: Decodable {
  let E2EKey: String
}

class Database {
  final let driver: DatabaseDriver?
  
  init(server: String) {
    let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as! String
    guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) else {
      self.driver = nil
      return
    }
    
    if let url = URL(string: server) {
      let scheme = url.scheme ?? ""
      let domain = url.absoluteString.replacingOccurrences(of: "\(scheme)://", with: "")
      
      
      if let driver = try? DatabaseDriver(dbName: "\(directory.path)/\(domain).db", schemaVersion: 10) {
        self.driver = driver
        return
      }
    }
    
    self.driver = nil
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
