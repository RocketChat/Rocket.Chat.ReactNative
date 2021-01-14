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
  private final var database: WatermelonDB.Database? = nil

  private var directory: String? {
    if let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String {
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) {
        return directory.path
      }
    }
    
    return nil
  }
  
  init(server: String) {
    if let url = URL(string: server) {
      if let domain = url.domain, let directory = directory {
        let isOfficial = Bundle.main.object(forInfoDictionaryKey: "IS_OFFICIAL") as? Bool ?? false
        self.database = WatermelonDB.Database(path: "\(directory)/\(domain)\(isOfficial ? "" : "-experimental").db")
      }
    }
  }
  
  func readRoomEncryptionKey(rid: String) -> String? {
    if let database = database {
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
  
  func readRoomEncrypted(rid: String) -> Bool {
    if let database = database {
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
