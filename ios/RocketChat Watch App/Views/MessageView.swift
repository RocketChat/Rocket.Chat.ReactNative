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
			Text(viewModel.date ?? "")
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
			if viewModel.hasDateSeparator {
				dateSeparator
			} else if viewModel.hasUnreadSeparator {
				unreadSeparator
			}
			if viewModel.isHeader {
				HStack(alignment: .center) {
					Text(viewModel.sender ?? "")
						.lineLimit(1)
						.font(.caption.bold())
						.foregroundStyle(.primary)
					Text(viewModel.time ?? "")
						.lineLimit(1)
						.font(.footnote)
						.foregroundStyle(.secondary)
				}
			}
			if let text = viewModel.info {
				Text(text)
					.font(.caption.italic())
					.foregroundStyle(.primary)
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
