//
//  Database.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/14/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import WatermelonDB

final class Database {
  private var databases: [String: WatermelonDB.Database] = [:]
  private var cache: [String: String] = [:]
  
  static let shared = Database()
  
  private var directory: String? {
    if let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String {
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) {
        return directory.path
      }
    }
    
    return nil
  }
  
  func setup(server: String) -> WatermelonDB.Database? {
    if let database = databases[server] {
      return database
    }
    
    if let url = URL(string: server) {
      if let domain = url.domain, let directory = self.directory {
        databases[server] = WatermelonDB.Database(path: "\(directory)/\(domain).db")
        return databases[server]
      }
    }
    
    return nil
  }
  
  func readRoomEncryptionKey(rid: String, server: String) -> String? {
    if let e2eKey = cache[rid] {
      return e2eKey
    }

    if let database = setup(server: server) {
      let results = try! database.queryRaw("select * from subscriptions where id == ? limit 1", [rid])

        guard let record = results.next() else {
            return nil
        }

        if let room = record.resultDictionary! as? [String: Any] {
          if let e2eKey = room["e2e_key"] as? String {
            cache[rid] = e2eKey
            return cache[rid]
          }
        }
    }
    
    return nil
  }
}
