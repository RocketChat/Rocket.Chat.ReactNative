import Foundation

enum StorageKey: String {
	case currentServer = "current_server"
}

@propertyWrapper
struct Storage<T: Codable> {
	private let key: StorageKey
	private let defaultValue: T?
	
	init(_ key: StorageKey, defaultValue: T? = nil) {
		self.key = key
		self.defaultValue = defaultValue
	}
	
	var wrappedValue: T? {
		get {
			guard let data = UserDefaults.standard.object(forKey: key.rawValue) as? Data else {
				return defaultValue
			}
			
			let value = try? JSONDecoder().decode(T.self, from: data)
			return value ?? defaultValue
		}
		set {
			let data = try? JSONEncoder().encode(newValue)
			
			UserDefaults.standard.set(data, forKey: key.rawValue)
		}
	}
}
