import Foundation

final class RoomViewModel: ObservableObject {
	@Published var room: Room
	@Published var server: Server
	
	private let formatter: RoomFormatter
	
	init(room: Room, server: Server) {
		self.room = room
		self.server = server
		self.formatter = RoomFormatter(room: room, server: server)
	}
	
	var title: String? {
		formatter.title
	}
	
	var iconName: String? {
		if room.prid != nil {
			return "discussions"
		} else if room.teamMain == true, room.t == "p" {
			return "teams-private"
		} else if room.teamMain == true {
			return "teams"
		} else if room.t == "p" {
			return "channel-private"
		} else if room.t == "c" {
			return "channel-public"
		} else if room.t == "d", formatter.isGroupChat {
			return "message"
		}
		
		return nil
	}
	
	var lastMessage: String {
		guard let user = room.lastMessage?.user else {
			return "No Message"
		}
		
		let isLastMessageSentByMe = user.username == server.loggedUser.username
		let username = isLastMessageSentByMe ? "You" : ((server.useRealName ? user.name : user.username) ?? "")
		let message = room.lastMessage?.msg ?? "No message"
		
		if room.lastMessage?.t == "jitsi_call_started" {
			return "Call started by: \(username)"
		}
		
		if room.lastMessage?.attachments?.allObjects.isEmpty == false {
			return "\(username) sent an attachment"
		}
		
		if room.lastMessage?.t == "e2e" {
			return "Encrypted message"
		}
		
		if room.lastMessage?.t == "videoconf" {
			return "Call started"
		}
		
		if room.t == "d", !isLastMessageSentByMe {
			return message
		}
		
		return "\(username): \(message)"
	}
	
	var updatedAt: String? {
		guard let ts = room.ts else {
			return nil
		}
		
		let calendar = Calendar.current
		let dateFormatter = DateFormatter()
		dateFormatter.locale = Locale.current
		dateFormatter.timeZone = TimeZone.current
		
		if calendar.isDateInYesterday(ts) {
			return "Yesterday"
		}
		
		if calendar.isDateInToday(ts) {
			dateFormatter.timeStyle = .short
			dateFormatter.dateStyle = .none
			
			return dateFormatter.string(from: ts)
		}
		
		if isInPreviousWeek(date: ts) {
			dateFormatter.dateFormat = "EEEE"
			
			return dateFormatter.string(from: ts)
		}
		
		dateFormatter.timeStyle = .none
		dateFormatter.dateStyle = .short
		
		return dateFormatter.string(from: ts)
	}
	
	private func isInPreviousWeek(date: Date) -> Bool {
		let oneDay = 24 * 60 * 60
		let calendar = Calendar.current
		let currentDate = Date()
		let lastWeekDate = currentDate.addingTimeInterval(TimeInterval(-7 * oneDay))
		
		return calendar.isDate(
			date,
			equalTo: lastWeekDate,
			toGranularity: .weekOfYear
		)
	}
}
