import Foundation

final class RoomFormatter {
	private let room: Room
	private let server: Server
	
	init(room: Room, server: Server) {
		self.room = room
		self.server = server
	}
	
	var title: String? {
		if isGroupChat, !(room.name != nil && room.name?.isEmpty == false), let usernames = room.usernames {
			return usernames
				.filter { $0 == server.loggedUser.username }
				.sorted()
				.joined(separator: ", ")
		}
		
		if room.t != "d" {
			return room.fname ?? room.name
		}
		
		if room.prid != nil || server.useRealName {
			return room.fname ?? room.name
		}
		
		return room.name
	}
	
	var isGroupChat: Bool {
		if let uids = room.uids, uids.count > 2 {
			return true
		}
		
		if let usernames = room.usernames, usernames.count > 2 {
			return true
		}
		
		return false
	}
}
