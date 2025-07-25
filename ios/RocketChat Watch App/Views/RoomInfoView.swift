import SwiftUI

struct RoomInfoView: View {
	@ObservedObject private var room: Room
	
	init(room: Room) {
		self.room = room
	}
	
	var body: some View {
		ScrollView {		
			VStack(alignment: .leading, spacing: 8) {
				Text(room.fname ?? "")
					.font(.caption)
					.fontWeight(.medium)
					.foregroundStyle(Color.titleLabels)
				Text(room.name ?? "")
					.font(.caption2)
					.fontWeight(.regular)
					.foregroundStyle(Color.secondaryInfo)
				Spacer()
			}
		}
	}
}
