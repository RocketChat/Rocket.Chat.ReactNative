import CoreData

final class RoomModel {
	private let context: NSManagedObjectContext
	
	init(context: NSManagedObjectContext) {
		self.context = context
	}
	
	@discardableResult
	func upsert(_ newRoom: MergedRoom) -> Room {
		let room = room(id: newRoom.id, in: context)
		
		room.name = newRoom.name ?? room.name
		room.fname = newRoom.fname ?? room.fname
		room.t = newRoom.t
		room.unread = Int32(newRoom.unread)
		room.alert = newRoom.alert
		room.lr = newRoom.lr ?? room.lr
		room.open = newRoom.open ?? true
		room.rid = newRoom.rid
		room.hideUnreadStatus = newRoom.hideUnreadStatus ?? room.hideUnreadStatus
		
		room.updatedAt = newRoom.updatedAt ?? room.updatedAt
		room.usernames = newRoom.usernames ?? room.usernames
		room.uids = newRoom.uids ?? room.uids
		room.prid = newRoom.prid ?? room.prid
		room.isReadOnly = newRoom.isReadOnly ?? room.isReadOnly
		room.encrypted = newRoom.encrypted ?? room.encrypted
		room.teamMain = newRoom.teamMain ?? room.teamMain
		room.archived = newRoom.archived ?? room.archived
		room.broadcast = newRoom.broadcast ?? room.broadcast
		room.ts = newRoom.ts ?? room.ts
		
		let messageDatabase = MessageModel(context: context)
		
		if let lastMessage = newRoom.lastMessage {
			let message = messageDatabase.upsert(lastMessage)
			message.room = room
		}
		
		return room
	}
	
	func delete(_ room: Room) {
		context.delete(room)
	}
	
	func fetch(ids: [String]) -> [Room] {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "id IN %@", ids)
		
		return (try? context.fetch(request)) ?? []
	}
	
	func fetch(id: String) -> Room {
		room(id: id, in: context)
	}
}

extension RoomModel {
	private func room(id: String, in context: NSManagedObjectContext) -> Room {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		guard let room = try? context.fetch(request).first else {
			let room = Room(context: context)
			room.id = id
			
			return room
		}
		
		return room
	}
	
	private func room(rid: String, in context: NSManagedObjectContext) -> Room {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "rid == %@", rid)
		
		guard let room = try? context.fetch(request).first else {
			let room = Room(context: context)
			room.rid = rid
			
			return room
		}
		
		return room
	}
}
