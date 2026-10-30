import SwiftUI

struct MessageComposerView: View {
	@State private var message = ""
	
	let room: Room
	@ObservedObject var server: Server
	let anchorID: String
	let onSend: (String) -> Void
	
	var body: some View {
		if room.isReadOnly {
			VStack(spacing: 0) {
				HStack {
					Spacer()
					Text("This room is read only")
						.font(.caption.bold())
						.foregroundStyle(.white)
						.multilineTextAlignment(.center)
					Spacer()
				}
				
				Color.clear
					.frame(height: 1)
					.id(anchorID)
			}
		} else {
			VStack(alignment: .leading, spacing: 4) {
				TextField("Message", text: $message)
					.submitLabel(.send)
					.onSubmit(send)
				
				Color.clear
					.frame(height: 1)
					.id(anchorID)
				
				if !server.quickReplies.isEmpty {
					VStack(spacing: 6) {
						ForEach(server.quickReplies, id: \.self) { reply in
							Text(reply)
								.font(.caption)
								.foregroundStyle(.white)
								.frame(maxWidth: .infinity, alignment: .leading)
								.padding(.horizontal, 12)
								.padding(.vertical, 8)
								.background(
									RoundedRectangle(cornerRadius: 10)
										.fill(Color.white.opacity(0.12))
								)
								.contentShape(Rectangle())
								.onTapGesture {
									onSend(reply)
								}
								.accessibilityAddTraits(.isButton)
								.accessibilityLabel(reply)
						}
					}
				}
			}
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
