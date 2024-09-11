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

    // Initialize the database with a name (which gets converted to a path)
    init(name: String) {
        if let dbPath = self.getDatabasePath(databaseName: name) {
            openDatabase(databasePath: dbPath)
        } else {
            print("Could not resolve database path for name: \(name)")
        }
    }

    // Initialize the database using the server's domain
    init(server: String) {
        // Extract domain from server URL
        let domain = URL(string: server)?.host ?? ""
        if let dbPath = self.getDatabasePath(databaseName: domain) {
            openDatabase(databasePath: dbPath)
        } else {
            print("Could not resolve database path for server: \(server)")
        }
    }

    // Get the path to the SQLite database file based on its name
    func getDatabasePath(databaseName: String) -> String? {
        let fileManager = FileManager.default
        if let documentDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first {
            let dbURL = documentDirectory.appendingPathComponent("\(databaseName).db")
            return dbURL.path
        }
        return nil
    }

    // Open the SQLite database
    func openDatabase(databasePath: String) {
        if sqlite3_open(databasePath, &db) == SQLITE_OK {
            print("Successfully opened database at \(databasePath)")
        } else {
            print("Unable to open database.")
        }
    }

    // Close the SQLite database
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

    // Execute a query and return results as an array of dictionaries
    func query(_ query: String, args: [String] = []) -> [[String: Any]]? {
        var statement: OpaquePointer?
        var results: [[String: Any]] = []

        if sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK {
            // Bind arguments to the prepared statement
            for (index, arg) in args.enumerated() {
                sqlite3_bind_text(statement, Int32(index + 1), arg, -1, nil)
            }

            // Process each row in the result set
            while sqlite3_step(statement) == SQLITE_ROW {
                var row: [String: Any] = [:]
                for columnIndex in 0..<sqlite3_column_count(statement) {
                    let columnName = String(cString: sqlite3_column_name(statement, columnIndex))
                    let columnType = sqlite3_column_type(statement, columnIndex)

                    // Extract the value based on its type
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

    // Fetch the encryption key for a room (subscriptions table)
    func readRoomEncryptionKey(for roomId: String) -> String? {
        let query = "SELECT e2e_key FROM subscriptions WHERE id = ? LIMIT 1"
        if let results = self.query(query, args: [roomId]), let firstResult = results.first {
            return firstResult["e2e_key"] as? String
        }
        return nil
    }

    // Example method to fetch encrypted status for a room
    func readRoomEncrypted(for roomId: String) -> Bool {
        let query = "SELECT encrypted FROM subscriptions WHERE id = ? LIMIT 1"
        if let results = self.query(query, args: [roomId]), let firstResult = results.first {
            return firstResult["encrypted"] as? Bool ?? false
        }
        return false
    }
}
