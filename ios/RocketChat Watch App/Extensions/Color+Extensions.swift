import SwiftUI

extension Color {
	static var titleLabels: Color {
		Color(hex: 0xF2F3F5)
	}
	
	static var `default`: Color {
		Color(hex: 0xE4E7EA)
	}
	
	static var secondaryInfo: Color {
		Color(hex: 0x9EA2A8)
	}
}

private extension Color {
	init(hex: UInt, alpha: Double = 1) {
		self.init(
			.sRGB,
			red: Double((hex >> 16) & 0xff) / 255,
			green: Double((hex >> 08) & 0xff) / 255,
			blue: Double((hex >> 00) & 0xff) / 255,
			opacity: alpha
		)
	}
}
