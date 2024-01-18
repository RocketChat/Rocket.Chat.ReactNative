import SwiftUI

struct MessageView: View {
	@ObservedObject private var viewModel: MessageViewModel
	
	init(viewModel: MessageViewModel) {
		self.viewModel = viewModel
	}
	
	var body: some View {
		VStack(alignment: .leading) {
			if viewModel.messageFormatter.hasDateSeparator() {
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
			//            if let attachments = message.attachments?.allObjects as? Array<Attachment> {
			//                ForEach(attachments) { attachment in
			//                    AttachmentView(attachment: attachment)
			//                }
			//            }
		}
	}
}
