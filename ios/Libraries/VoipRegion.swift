import Foundation

enum VoipRegion {
	static func isChina() -> Bool {
		if #available(iOS 16, *) {
			return Locale.current.region?.identifier == "CN"
		}
		return Locale.current.regionCode == "CN"
	}
}
