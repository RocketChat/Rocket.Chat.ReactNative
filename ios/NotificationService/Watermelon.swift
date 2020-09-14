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

class Watermelon {
  func readRoom(rid: String, server: String, completion: @escaping (_ response: Any?) -> Void) {
    let databaseBridge = DatabaseBridge()
    
    func resolve(response: Any?) {

    }
    
    func reject(code: String?, message: String?, _: Error?) {

    }

    let suiteName = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as! String
    guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: suiteName) else {
      return
    }
    
    if let url = URL(string: server) {
      let scheme = url.scheme ?? ""
      let domain = url.absoluteString.replacingOccurrences(of: "\(scheme)://", with: "")
      
      databaseBridge.initialize(tag: 3, databaseName: "\(directory.path)/\(domain).db", schemaVersion: 10, resolve: resolve, reject: reject)
      databaseBridge.find(tag: 3, table: "subscriptions", id: rid, resolve: completion, reject: reject)
    }
  }
}
