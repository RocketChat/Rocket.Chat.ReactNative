import SwiftUI

struct RoomView: View {
    @ObservedObject var viewModel: RoomViewModel
    
    private var isUnread: Bool {
      viewModel.room.unread > 0 || viewModel.room.alert
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
                    .font(.caption)
                    .fontWeight(isUnread ? .bold : .medium)
                    .foregroundStyle(.primary)
                Spacer()
                Text(viewModel.updatedAt ?? "")
                    .lineLimit(1)
                    .font(.footnote)
                    .fontWeight(isUnread ? .bold : .medium)
                    .foregroundStyle(isUnread ? .blue : .primary)
            }
            HStack(alignment: .top) {
                Text(viewModel.lastMessage)
                    .lineLimit(2)
                    .font(.caption2)
                    .foregroundStyle(isUnread ? .primary : .secondary)
                Spacer()
              if isUnread, viewModel.room.unread > 0 {
                Text(String(viewModel.room.unread))
                        .font(.footnote)
                        .fontWeight(.bold)
                        .padding(6)
                        .background(
                            Circle()
                                .fill(.blue)
                        )
                        .foregroundColor(.primary)
                }
            }
        }
    }
}
