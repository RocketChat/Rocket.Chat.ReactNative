import SwiftUI

struct RetryView: View {
	private let label: String
	private let action: () -> Void
	
	init(_ label: String, action: @escaping () -> Void) {
		self.label = label
		self.action = action
	}
	
	var body: some View {
		VStack {
			Text(label)
				.multilineTextAlignment(.center)
			Button("Try Again", action: action)
		}
		.padding()
	}
}
