import SwiftUI

struct MessageComposerView: View {
	@State private var message = ""
	
	let room: Room
	let onSend: (String) -> Void
    
    @Storage(.quickReplies, defaultValue: [])
    private var quickReplies: [String]?
	
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
            VStack(alignment: .leading, spacing: 4) {
                TextField("Message", text: $message)
                    .submitLabel(.send)
                    .onSubmit(send)
                
                if let replies = quickReplies, !replies.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach(replies, id: \.self) { reply in
                                if #available(watchOS 26.0, *) {
                                    Button {
                                        message = reply
                                        send()
                                    } label: {
                                        Text(reply)
                                            .font(.caption2)
                                            .foregroundStyle(.primary)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 4)
                                    }
                                    .buttonStyle(.plain)
                                    .glassEffect(.regular)
                                    .clipShape(Capsule())
                                } else {
                                    Button {
                                        message = reply
                                        send()
                                    } label: {
                                        Text(reply)
                                            .font(.caption2)
                                            .foregroundStyle(.primary)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(
                                                Capsule()
                                                    .fill(Color.white.opacity(0.12))
                                            )
                                    }
                                    .buttonStyle(.borderedProminent)
                                }
                            }
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
