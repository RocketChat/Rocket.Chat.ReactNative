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
	private let database: WatermelonDB.Database
	
	init(server: String) {
		let domain = URL(string: server)?.domain ?? ""
		database = .init(name: domain)
	}
	
	func readRoomEncryptionKey(rid: String) -> String? {
		// TODO: fix: queryRaw is no longer available
		// if let results = try? database.queryRaw("select * from subscriptions where id == ? limit 1", [rid]) {
		// 	guard let record = results.next() else {
		// 		return nil
		// 	}
			
		// 	if let room = record.resultDictionary as? [String: Any] {
		// 		if let e2eKey = room["e2e_key"] as? String {
		// 			return e2eKey
		// 		}
		// 	}
		// }
		
		return nil
	}
	
	func readRoomEncrypted(rid: String) -> Bool {
		// TODO: fix: queryRaw is no longer available
		// if let results = try? database.queryRaw("select * from subscriptions where id == ? limit 1", [rid]) {
		// 	guard let record = results.next() else {
		// 		return false
		// 	}
			
		// 	if let room = record.resultDictionary as? [String: Any] {
		// 		if let encrypted = room["encrypted"] as? Bool {
		// 			return encrypted
		// 		}
		// 	}
		// }
		
		return false
	}
}
