//
//  Database.swift
//  NotificationService
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 9/14/20.
//  Copyright © 2020 Rocket.Chat. All rights reserved.
//

import Foundation
import SQLite3

class Database {
    var db: OpaquePointer?

    init(name: String) {
        if let dbPath = self.getDatabasePath(name: name) {
            openDatabase(databasePath: dbPath)
        } else {
            print("Could not resolve database path for name: \(name)")
        }
    }
    
    init(server: String) {
        let domain = URL(string: server)?.domain ?? ""
        if let dbPath = self.getDatabasePath(name: domain) {
            openDatabase(databasePath: dbPath)
        } else {
            print("Could not resolve database path for server: \(server)")
        }
    }

    func getDatabasePath(name: String) -> String? {
        let isOfficial = Bundle.main.bool(forKey: "IS_OFFICIAL")
        let groupDir = FileManager.default.groupDir()
        return "\(groupDir)/\(name)\(isOfficial ? "" : "-experimental").db"
    }

    func openDatabase(databasePath: String) {
        if sqlite3_open(databasePath, &db) == SQLITE_OK {
            print("Successfully opened database at \(databasePath)")
        } else {
            print("Unable to open database.")
        }
    }

    func closeDatabase() {
        if sqlite3_close(db) != SQLITE_OK {
            print("Error closing database")
        } else {
            print("Database closed successfully")
        }
        db = nil
    }

    deinit {
        closeDatabase()
    }

    func query(_ query: String, args: [String] = []) -> [[String: Any]]? {
        var statement: OpaquePointer?
        var results: [[String: Any]] = []

        if sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK {
            for (index, arg) in args.enumerated() {
                sqlite3_bind_text(statement, Int32(index + 1), arg, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            }

            while sqlite3_step(statement) == SQLITE_ROW {
                var row: [String: Any] = [:]
                for columnIndex in 0..<sqlite3_column_count(statement) {
                    let columnName = String(cString: sqlite3_column_name(statement, columnIndex))
                    let columnType = sqlite3_column_type(statement, columnIndex)

                    switch columnType {
                    case SQLITE_INTEGER:
                        let value = sqlite3_column_int64(statement, columnIndex)
                        row[columnName] = Int(value)
                    case SQLITE_FLOAT:
                        let value = sqlite3_column_double(statement, columnIndex)
                        row[columnName] = Double(value)
                    case SQLITE_TEXT:
                        let value = String(cString: sqlite3_column_text(statement, columnIndex))
                        row[columnName] = value
                    default:
                        row[columnName] = nil
                    }
                }
                results.append(row)
            }
        } else {
            print("Failed to prepare query: \(query)")
        }

        sqlite3_finalize(statement)
        return results
    }
    
    func decodeQueryResult<T: Decodable>(_ result: [[String: Any]]) -> [T]? {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: result, options: [])
            let decodedObjects = try JSONDecoder().decode([T].self, from: jsonData)
            return decodedObjects
        } catch {
            print("Failed to decode result: \(error)")
            return nil
        }
    }

    func readRoomEncryptionKey(for roomId: String) -> String? {
        let query = "SELECT e2e_key FROM subscriptions WHERE rid = ? LIMIT 1"
        if let results = self.query(query, args: [roomId]), let firstResult = results.first {
            return firstResult["e2e_key"] as? String
        }
        return nil
    }

    func readRoomEncrypted(for roomId: String) -> Bool {
        let query = "SELECT encrypted FROM subscriptions WHERE rid = ? LIMIT 1"
        if let results = self.query(query, args: [roomId]), let firstResult = results.first {
            if let encrypted = firstResult["encrypted"] as? NSNumber {
                return encrypted.boolValue
            }
        }
        return false
    }
}
