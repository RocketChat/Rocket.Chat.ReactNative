import SwiftUI

struct MessageView: View {
	@ObservedObject private var viewModel: MessageViewModel
	
	private let client: RocketChatClientProtocol
	
	init(client: RocketChatClientProtocol, viewModel: MessageViewModel) {
		self.client = client
		self.viewModel = viewModel
	}
	
	@ViewBuilder
	private var unreadSeparator: some View {
		HStack(alignment: .center) {
			Text("Unread messages")
				.lineLimit(1)
				.font(.footnote)
				.foregroundStyle(.red)
				.layoutPriority(1)
			VStack(alignment: .center) {
				Divider()
					.overlay(.red)
			}
		}
	}
	
	@ViewBuilder
	private var dateSeparator: some View {
		HStack(alignment: .center) {
			VStack(alignment: .center) {
				Divider()
					.overlay(.secondary)
			}
			Text(viewModel.messageFormatter.date() ?? "")
				.lineLimit(1)
				.font(.footnote)
				.foregroundStyle(.secondary)
				.layoutPriority(1)
			VStack(alignment: .center) {
				Divider()
					.overlay(.secondary)
			}
		}
	}
	
	var body: some View {
		VStack(alignment: .leading) {
			if viewModel.messageFormatter.hasDateSeparator() {
				dateSeparator
			} else if viewModel.messageFormatter.hasUnreadSeparator() {
				unreadSeparator
			}
			if viewModel.messageFormatter.isHeader() {
				HStack(alignment: .center) {
					Text(viewModel.sender ?? "")
						.lineLimit(1)
						.font(.caption)
						.fontWeight(.bold)
						.foregroundStyle(.primary)
					Text(viewModel.messageFormatter.time() ?? "")
						.lineLimit(1)
						.font(.footnote)
						.foregroundStyle(.secondary)
				}
			}
			if let text = viewModel.messageFormatter.info() {
				Text(text)
					.font(.caption)
					.foregroundStyle(.primary)
					.italic()
			} else if let text = viewModel.message.msg {
				Text(text)
					.font(.caption)
					.foregroundStyle(viewModel.message.status == "temp" ? .secondary : .primary)
			}
			if let attachments = viewModel.message.attachments?.allObjects as? Array<Attachment> {
				ForEach(attachments) { attachment in
					AttachmentView(attachment: attachment, client: client)
				}
			}
		}
	}
}
