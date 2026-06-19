//
//  DatabaseKeyStore.swift
//  Rocket.Chat
//
//  Stores and retrieves per-database SQLCipher keys in the iOS Keychain.
//
//  Attributes:
//    kSecClass:              kSecClassGenericPassword
//    kSecAttrService:        kDatabaseKeyStoreService  ("chat.rocket.reactnative.dbkeys")
//    kSecAttrAccount:        the storage key ("db_key_v1:<dbName>")
//    kSecAttrAccessGroup:    "S6UPZG7ZR3.chat.rocket.reactnative"
//                            Full team-prefixed form required — the Security framework does
//                            NOT prepend the team ID; the bare suffix fails with
//                            errSecMissingEntitlement (-34018).
//    kSecAttrAccessible:     kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
//                            Allows NSE access after the device has been unlocked once
//                            (e.g. after boot before the user opens the app).
//    kSecAttrSynchronizable: false  — device-only, not synced via iCloud Keychain

import Foundation
import Security

@objc(DatabaseKeyStore)
final class DatabaseKeyStore: NSObject {

	// kSecAttrService shared between this module and Database.swift
	static let service = "chat.rocket.reactnative.dbkeys"

	// Full team-prefixed access group — bare suffix fails with errSecMissingEntitlement
	private static let accessGroup = "S6UPZG7ZR3.chat.rocket.reactnative"

	// MARK: - Native-side helpers (called from DatabaseKeyStore.mm and Database.swift in extensions)

	/// Read a key by account name.
	/// Returns the stored string on success.
	/// Returns nil with error == nil on a genuine not-found (errSecItemNotFound).
	/// Returns nil with error set on any other Keychain failure or undecodable data.
	/// Safe to call from the NotificationService extension — the access group is shared.
	@objc(readAccount:error:) static func read(account: String, error: NSErrorPointer) -> String? {
		let query: [String: Any] = [
			kSecClass as String:              kSecClassGenericPassword,
			kSecAttrService as String:        service,
			kSecAttrAccount as String:        account,
			kSecAttrAccessGroup as String:    accessGroup,
			kSecAttrSynchronizable as String: kCFBooleanFalse!,
			kSecMatchLimit as String:         kSecMatchLimitOne,
			kSecReturnData as String:         kCFBooleanTrue!
		]
		var result: AnyObject?
		let status = SecItemCopyMatching(query as CFDictionary, &result)
		if status == errSecItemNotFound {
			return nil  // true not-found; error stays nil
		}
		guard status == errSecSuccess, let data = result as? Data, let value = String(data: data, encoding: .utf8) else {
			error?.pointee = NSError(
				domain: "DatabaseKeyStore",
				code: Int(status),
				userInfo: [NSLocalizedDescriptionKey: "Keychain read failed for account \(account)"]
			)
			return nil  // failure; error is set
		}
		return value
	}

	/// Write a key. Write-once: never overwrites an existing key — on a duplicate it
	/// succeeds only if the stored value already matches the value being written.
	/// Returns false on an unexpected Keychain error or a conflicting existing value.
	@discardableResult
	@objc(write:value:) static func write(account: String, value: String) -> Bool {
		let data = Data(value.utf8)
		let attrs: [String: Any] = [
			kSecClass as String:              kSecClassGenericPassword,
			kSecAttrService as String:        service,
			kSecAttrAccount as String:        account,
			kSecAttrAccessGroup as String:    accessGroup,
			kSecAttrAccessible as String:     kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly as String,
			kSecAttrSynchronizable as String: kCFBooleanFalse!,
			kSecValueData as String:          data
		]

		let addStatus = SecItemAdd(attrs as CFDictionary, nil)
		if addStatus == errSecSuccess {
			return true
		}
		if addStatus == errSecDuplicateItem {
			var readError: NSError?
			let existing = read(account: account, error: &readError)
			return readError == nil && existing == value
		}
		NSLog("[DatabaseKeyStore] write failed for account %@, status=%d", account, addStatus)
		return false
	}

	/// Delete an item. No-op if not found.
	@objc(delete:) static func delete(account: String) {
		let query: [String: Any] = [
			kSecClass as String:              kSecClassGenericPassword,
			kSecAttrService as String:        service,
			kSecAttrAccount as String:        account,
			kSecAttrAccessGroup as String:    accessGroup,
			kSecAttrSynchronizable as String: kCFBooleanFalse!
		]
		SecItemDelete(query as CFDictionary)
	}
}
