import SwiftUI

struct AttachmentView: View {
	private let attachment: Attachment
	private let client: RocketChatClientProtocol
	
	init(attachment: Attachment, client: RocketChatClientProtocol) {
		self.attachment = attachment
		self.client = client
	}
	
	var body: some View {
		if let rawURL = attachment.imageURL {
			VStack(alignment: .leading) {
				if let msg = attachment.msg {
					Text(msg)
						.font(.caption)
						.foregroundStyle(.white)
				}
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
			}
		} else {
			EmptyView()
		}
	}
}
