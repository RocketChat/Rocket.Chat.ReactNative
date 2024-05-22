import SwiftUI

struct RetryView: View {
	private let label: LocalizedStringKey
	private let action: () -> Void
	
	init(_ label: LocalizedStringKey, action: @escaping () -> Void) {
		self.label = label
		self.action = action
	}
	
	var body: some View {
		VStack {
			Text(label)
				.multilineTextAlignment(.center)
			Button("Try again", action: action)
		}
		.padding()
	}
}
