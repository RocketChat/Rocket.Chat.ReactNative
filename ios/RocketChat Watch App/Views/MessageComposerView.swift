import SwiftUI

struct MessageComposerView: View {
    @State private var message = ""

    let room: Room
    let server: Server
    let anchorID: String
    let onSend: (String) -> Void

    private var quickReplies: [String] {
        server.quickReplies
    }

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

                Color.clear
                    .frame(height: 1)
                    .id(anchorID)

                if !quickReplies.isEmpty {
                        VStack(spacing: 6) {
                            ForEach(quickReplies, id: \.self) { reply in
                                Text(reply)
                                    .font(.caption)
                                    .foregroundStyle(.white)
                                    .frame(
                                        maxWidth: .infinity,
                                        alignment: .leading
                                    )
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(Color.white.opacity(0.12))
                                    )
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        message = reply
                                        send()
                                    }
                            }
                        }
                        .frame(maxWidth: .infinity)
                } else {
                    Color.clear
                        .frame(height: 1)
                        .id(anchorID)
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
