import Foundation
import CoreTelephony

enum VoipRegion {
	/// Returns true when ANY active cellular subscriber reports MCC 460 (China),
	/// or — when no SIM is present — when the device locale region is "CN".
	/// MIIT gates on SIM identity, so dual-SIM devices with one CN SIM are gated.
	static func isChina() -> Bool {
		let info = CTTelephonyNetworkInfo()
		if let providers = info.serviceSubscriberCellularProviders, !providers.isEmpty {
			for (_, carrier) in providers {
				if carrier.mobileCountryCode == "460" { return true }
			}
			return false
		}
		return NSLocale.current.regionCode == "CN"
	}
}
