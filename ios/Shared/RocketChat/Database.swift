//
//  Database.swift
//  NotificationService
//
//  Opens SQLCipher-encrypted databases created by the JS expo-sqlite/Drizzle driver.
//
//  Open sequence (invariants — do not reorder):
//    1. sqlite3_open  → raw handle
//    2. PRAGMA key = "x'<64 hex>'"  ← raw-key form; must be the FIRST statement.
//       The x'...' prefix tells SQLCipher to use the bytes directly, skipping PBKDF2.
//       Using PBKDF2 (or omitting x'...') produces "file is not a database".
//    3. PRAGMA busy_timeout = 500  ← mandatory for multi-process WAL safety.
//       Without it the NSE starves on SQLITE_BUSY when the main app holds a WAL lock.
//    4. Verify with a trivial sqlite_master read — surfaces a wrong key immediately.
//
//  ARC ownership: the sqlite3 handle is owned by this class and closed in deinit.
//  Never expose the raw OpaquePointer outside this class — it becomes invalid after
//  deinit, causing SQLITE_MISUSE in any pending caller.

import Foundation
import SQLite3

class Database {

	// MARK: - Private state (handle is not exposed to callers)

	private var db: OpaquePointer?

	// MARK: - Initialisers

	/// Opens the per-server database.
	/// Derives the filename from serverUrl exactly as the JS driver does:
	///   strip trailing slashes → strip scheme → replace '/' with '.' → append ".db"
	init(server: String) {
		open(dbName: Database.deriveServerDbName(from: server))
	}

	/// Opens a database by bare name (e.g. "default.db" for the global DB).
	init(name: String) {
		open(dbName: name)
	}

	deinit {
		if db != nil {
			sqlite3_close(db)
			db = nil
		}
	}

	// MARK: - Filename derivation (mirrors JS `deriveServerDbName` in connection.ts)

	static func deriveServerDbName(from serverUrl: String) -> String {
		var s = serverUrl
		while s.hasSuffix("/") { s = String(s.dropLast()) }
		if let r = s.range(of: "://") {
			s = String(s[r.upperBound...])
		} else if s.hasPrefix("//") {
			s = String(s.dropFirst(2))
		}
		s = s.replacingOccurrences(of: "/", with: ".")
		return s + ".db"
	}

	// MARK: - Open helpers

	private func open(dbName: String) {
		guard let groupRoot = FileManager.default.containerURL(
			forSecurityApplicationGroupIdentifier: "group.ios.chat.rocket"
		)?.path else {
			NSLog("[Database] App Group container unavailable — cannot open %@", dbName)
			return
		}
		let path = (groupRoot as NSString).appendingPathComponent(dbName)

		guard sqlite3_open(path, &db) == SQLITE_OK else {
			NSLog("[Database] sqlite3_open failed for %@: %@", dbName, String(cString: sqlite3_errmsg(db)))
			sqlite3_close(db)
			db = nil
			return
		}

		// Read the key using the storage key that matches the JS KEY_PREFIX ("db_key_v1:<dbName>")
		let storageKey = "db_key_v1:\(dbName)"
		guard let keyHex = DatabaseKeyStore.read(account: storageKey) else {
			NSLog("[Database] No encryption key found for %@ — closing", dbName)
			sqlite3_close(db)
			db = nil
			return
		}

		// 2. Raw-key PRAGMA — must precede any schema access
		let keyPragma = "PRAGMA key = \"x'\(keyHex)'\";"
		guard sqlite3_exec(db, keyPragma, nil, nil, nil) == SQLITE_OK else {
			NSLog("[Database] PRAGMA key failed for %@: %@", dbName, String(cString: sqlite3_errmsg(db)))
			sqlite3_close(db)
			db = nil
			return
		}

		// 3. busy_timeout: prevent SQLITE_BUSY starvation when NSE and main app
		//    are both active with WAL reader locks on the same file
		sqlite3_exec(db, "PRAGMA busy_timeout = 500;", nil, nil, nil)

		// 4. Verify: a wrong key or corrupt file will fail here rather than at first use.
		//    PRAGMA key does not validate the key and prepare alone only parses SQL —
		//    the statement must be stepped so SQLCipher actually decrypts a page.
		var stmt: OpaquePointer?
		let prepareOk = sqlite3_prepare_v2(db, "SELECT count(*) FROM sqlite_master;", -1, &stmt, nil) == SQLITE_OK
		let verifyOk = prepareOk && sqlite3_step(stmt) == SQLITE_ROW
		sqlite3_finalize(stmt)
		if !verifyOk {
			NSLog("[Database] Open-verify failed for %@ — key may be wrong or file corrupt", dbName)
			sqlite3_close(db)
			db = nil
		}
	}

	// MARK: - Query API

	/// Execute a parameterised SELECT and return all rows as [String: Any].
	/// Args are bound as TEXT in order.
	func query(_ sql: String, args: [String] = []) -> [[String: Any]]? {
		guard db != nil else { return nil }

		var stmt: OpaquePointer?
		var results: [[String: Any]] = []

		guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
			NSLog("[Database] Failed to prepare query")
			return nil
		}
		defer { sqlite3_finalize(stmt) }

		for (i, arg) in args.enumerated() {
			sqlite3_bind_text(stmt, Int32(i + 1), arg, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
		}

		while sqlite3_step(stmt) == SQLITE_ROW {
			var row: [String: Any] = [:]
			for col in 0..<sqlite3_column_count(stmt) {
				let name = String(cString: sqlite3_column_name(stmt, col))
				switch sqlite3_column_type(stmt, col) {
				case SQLITE_INTEGER: row[name] = Int(sqlite3_column_int64(stmt, col))
				case SQLITE_FLOAT:   row[name] = sqlite3_column_double(stmt, col)
				case SQLITE_TEXT:    row[name] = String(cString: sqlite3_column_text(stmt, col))
				default:             row[name] = nil
				}
			}
			results.append(row)
		}
		return results
	}

	func decodeQueryResult<T: Decodable>(_ result: [[String: Any]]) -> [T]? {
		guard let data = try? JSONSerialization.data(withJSONObject: result),
			  let decoded = try? JSONDecoder().decode([T].self, from: data) else { return nil }
		return decoded
	}

	// MARK: - Typed helpers (called by Encryption.swift and RocketChat.swift)

	func readRoomEncryptionKey(for roomId: String) -> String? {
		guard let rows = query("SELECT e2e_key FROM subscriptions WHERE rid = ? LIMIT 1", args: [roomId]),
			  let first = rows.first else { return nil }
		return first["e2e_key"] as? String
	}

	func readRoomEncrypted(for roomId: String) -> Bool {
		guard let rows = query("SELECT encrypted FROM subscriptions WHERE rid = ? LIMIT 1", args: [roomId]),
			  let first = rows.first,
			  let val = first["encrypted"] as? NSNumber else { return false }
		return val.boolValue
	}
}
