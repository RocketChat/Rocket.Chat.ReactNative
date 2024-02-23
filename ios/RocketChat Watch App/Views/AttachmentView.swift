import SwiftUI

struct AttachmentView: View {
	@Dependency private var client: RocketChatClientProtocol
	
	private let attachment: Attachment
	
	init(attachment: Attachment) {
		self.attachment = attachment
	}
	
	var body: some View {
		VStack(alignment: .leading) {
			if let msg = attachment.msg {
				Text(msg)
					.font(.caption)
					.foregroundStyle(.white)
			}
			if let rawURL = attachment.imageURL {
					AsyncImage(url: client.authorizedURL(url: rawURL)) { image in
						image
							.resizable()
							.scaledToFit()
					} placeholder: {
						Rectangle()
							.foregroundStyle(.secondary)
							.aspectRatio(attachment.aspectRatio, contentMode: .fit)
							.overlay(ProgressView())
					}
					.cornerRadius(4)
			} else {
				Text("Attachment not supported.")
					.font(.caption.italic())
					.foregroundStyle(.primary)
			}
		}
	}
}
