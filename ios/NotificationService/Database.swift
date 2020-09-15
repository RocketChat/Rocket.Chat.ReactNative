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
  private var tag: Int = 1
  private var databases: [String: Int] = [:]
  private final let bridge = DatabaseBridge()
  
  static let shared = Database()
  
  private var directory: String? {
    if let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String {
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) {
        return directory.path
      }
    }

    return nil
  }
  
  func setup(server: String) -> Int? {
    if let tag = databases[server] {
      return tag
    }

    if let url = URL(string: server) {
      if let domain = url.domain, let directory = self.directory {
        self.tag += 1
        let tag = DatabaseBridge.ConnectionTag(value: self.tag)
        let _ = bridge.initializeSynchronous(tag: tag, databaseName: "\(directory)/\(domain).db", schemaVersion: 10)
        // databases[server] = self.tag
        return self.tag
      }
    }

    return nil
  }
  
  func readRoomEncryptionKey(rid: String, server: String) -> String? {
    if let tag = setup(server: server) {
      if let room = bridge.findSynchronous(tag: DatabaseBridge.ConnectionTag(value: tag), table: "subscriptions", id: rid) as? [String: Any] {
        if let result = room["result"] as? [String: Any] {
          if let e2e = result["e2e_key"] as? String {
            return e2e
          }
        }
      }
    }
    
    return nil
  }
}
