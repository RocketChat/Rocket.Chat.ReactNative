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
				
				guard let messageID = message.id, let msg = message.msg else { return }
				
				action(.resend(messageID, msg))
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
