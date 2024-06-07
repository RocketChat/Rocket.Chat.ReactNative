import SwiftUI

struct RoomView: View {
	@ObservedObject var viewModel: RoomViewModel
	
	private var isUnread: Bool {
		(viewModel.room.unread > 0 || viewModel.room.alert) && viewModel.room.hideUnreadStatus != true
	}
	
	var body: some View {
		VStack(alignment: .leading) {
			HStack {
				if let iconName = viewModel.iconName {
					Image(iconName)
						.resizable()
						.frame(width: 16, height: 16)
						.scaledToFit()
				}
				Text(viewModel.title ?? "")
					.lineLimit(1)
					.font(.caption.weight(isUnread ? .bold : .medium))
					.foregroundStyle(Color.default)
				Spacer()
				Text(viewModel.updatedAt ?? "")
					.lineLimit(1)
					.font(.footnote.weight(isUnread ? .bold : .regular))
					.foregroundStyle(isUnread ? .blue : Color.default)
			}
			HStack(alignment: .top) {
				Text(viewModel.lastMessage)
					.lineLimit(2)
					.font(.caption2)
					.foregroundStyle(isUnread ? Color.titleLabels : Color.default)
				Spacer()
				if isUnread, viewModel.room.unread > 0 {
					Text(String(viewModel.room.unread))
						.font(.footnote.bold())
						.padding(6)
						.background(
							Circle()
								.fill(.blue)
						)
						.foregroundColor(Color.default)
				}
			}
		}
	}
}
