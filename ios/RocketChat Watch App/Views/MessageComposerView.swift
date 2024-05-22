import SwiftUI

struct MessageComposerView: View {
	@State private var message = ""
	
	let room: Room
	let onSend: (String) -> Void
	
	var body: some View {
		if room.isReadOnly {
			HStack {
				Spacer()
				Text("This room is read only")
					.font(.caption.bold())
					.foregroundStyle(.white)
					.multilineTextAlignment(.center)
				Spacer()
			}
		} else {
			TextField("Message", text: $message)
				.submitLabel(.send)
				.onSubmit(send)
		}
	}
	
	func send() {
		guard !message.isEmpty else {
			return
		}
		
		onSend(message)
		message = ""
	}
}
