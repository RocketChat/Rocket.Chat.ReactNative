import SwiftUI

struct MessageActionView: View {
	@Environment(\.dismiss) private var dismiss
	
	private let action: (MessageAction) -> Void
	private let message: Message
	
	init(message: Message, action: @escaping (MessageAction) -> Void) {
		self.action = action
		self.message = message
	}
	
	var body: some View {
		VStack {
			Button(action: {
				dismiss()
				
				action(.resend(message))
			}, label: {
				Text("Resend")
			})
			Button(action: {
				dismiss()
				
				action(.delete(message))
			}, label: {
				Text("Delete")
					.foregroundStyle(.red)
			})
		}
		.padding()
	}
}
