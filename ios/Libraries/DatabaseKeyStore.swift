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
final class DatabaseKeyStore: NSObject, RCTBridgeModule {

	// kSecAttrService shared between this module and Database.swift
	static let service = "chat.rocket.reactnative.dbkeys"

	// Full team-prefixed access group — bare suffix fails with errSecMissingEntitlement
	private static let accessGroup = "S6UPZG7ZR3.chat.rocket.reactnative"

	static func moduleName() -> String! { "DatabaseKeyStore" }

	static func requiresMainQueueSetup() -> Bool { false }

	// MARK: - JS-facing methods

	@objc func getItem(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		if let value = DatabaseKeyStore.read(account: key) {
			resolve(value)
		} else {
			resolve(nil)
		}
	}

	@objc func setItem(_ key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		let ok = DatabaseKeyStore.write(account: key, value: value)
		if ok {
			resolve(nil)
		} else {
			reject("KEYCHAIN_WRITE_ERROR", "Failed to store item in Keychain", nil)
		}
	}

	@objc func removeItem(_ key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		DatabaseKeyStore.delete(account: key)
		resolve(nil)
	}

	// MARK: - Native-side helpers (called from Database.swift in extensions)

	/// Read a key by account name. Returns nil if not found.
	/// Safe to call from the NotificationService extension — the access group is shared.
	static func read(account: String) -> String? {
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
		guard status == errSecSuccess, let data = result as? Data else {
			return nil
		}
		return String(data: data, encoding: .utf8)
	}

	/// Write a key. Idempotent: updates the item if it already exists.
	/// Returns false only on an unexpected Keychain error.
	@discardableResult
	static func write(account: String, value: String) -> Bool {
		let data = Data(value.utf8)
		var attrs: [String: Any] = [
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
			attrs.removeValue(forKey: kSecValueData as String)
			let updateStatus = SecItemUpdate(attrs as CFDictionary, [kSecValueData as String: data] as CFDictionary)
			return updateStatus == errSecSuccess
		}
		NSLog("[DatabaseKeyStore] write failed for account %@, status=%d", account, addStatus)
		return false
	}

	/// Delete an item. No-op if not found.
	static func delete(account: String) {
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
