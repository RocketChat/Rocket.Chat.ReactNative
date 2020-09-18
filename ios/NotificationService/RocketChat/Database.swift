//
//  Database.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/14/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import WatermelonDB

final class Database {
  private var databases: [String: WatermelonDB.Database] = [:]
  
  static let shared = Database()
  
  private var queue = DispatchQueue(label: "chat.rocket.databaseQueue")
  
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
    queue.sync {
      if let database = setup(server: server) {
        if let results = try? database.queryRaw("select * from subscriptions where id == ? limit 1", [rid]) {
          guard let record = results.next() else {
            return nil
          }
          
          if let room = record.resultDictionary as? [String: Any] {
            if let e2eKey = room["e2e_key"] as? String {
              return e2eKey
            }
          }
        }
      }
      
      return nil
    }
  }
  
  func readRoomEncrypted(rid: String, server: String) -> Bool {
    queue.sync {
      if let database = setup(server: server) {
        if let results = try? database.queryRaw("select * from subscriptions where id == ? limit 1", [rid]) {
          guard let record = results.next() else {
            return false
          }
          
          if let room = record.resultDictionary as? [String: Any] {
            if let encrypted = room["encrypted"] as? Bool {
              return encrypted
            }
          }
        }
      }
      
      return false
    }
  }
}
