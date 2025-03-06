import SwiftUI

extension ToolbarItemPlacement {
	static var `default`: Self {
		if #available(watchOS 10.0, *) {
			return .topBarLeading
		} else {
			return .automatic
		}
	}
}
