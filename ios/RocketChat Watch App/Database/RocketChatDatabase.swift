import CoreData

protocol Database {
	var viewContext: NSManagedObjectContext { get }
	
	func room(id: String) -> Room?
	func message(id: String) -> Message?
	func createTempMessage(msg: String, in room: Room, for loggedUser: LoggedUser) -> String
	func updateMessage(_ id: String, status: String)
	func remove(_ message: Message)
	
	func process(subscription: SubscriptionsResponse.Subscription)
	func process(subscription: SubscriptionsResponse.Subscription?, in updatedRoom: RoomsResponse.Room)
	func process(updatedMessage: MessageResponse, in room: Room)
	
	func save()
	
	func remove()
}

final class RocketChatDatabase: Database {
	private let server: Server
	
	init(server: Server) {
		self.server = server
	}
	
	var viewContext: NSManagedObjectContext {
		container.viewContext
	}
	
	private static let model: NSManagedObjectModel = {
		guard let url = Bundle.main.url(forResource: "RocketChat", withExtension: "momd"),
			  let managedObjectModel = NSManagedObjectModel(contentsOf: url) else {
			fatalError("Can't find Core Data Model")
		}
		
		return managedObjectModel
	}()
	
	private lazy var container: NSPersistentContainer = {
		let name = server.url.host ?? "default"
		
		let container = NSPersistentContainer(name: name, managedObjectModel: Self.model)
		
		container.loadPersistentStores { _, error in
			if let error { fatalError("Can't load persistent stores: \(error)") }
		}
		
		container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
		
		return container
	}()
	
	func save() {
		guard container.viewContext.hasChanges else {
			return
		}
		
		try? container.viewContext.save()
	}
	
	func createUser(id: String) -> User {
		let user = User(context: viewContext)
		user.id = id
		
		return user
	}
	
	func createRoom(id: String) -> Room {
		let room = Room(context: viewContext)
		room.id = id
		
		return room
	}
	
	func createMessage(id: String) -> Message {
		let message = Message(context: viewContext)
		message.id = id
		message.ts = Date()
		
		return message
	}
	
	func createAttachment(identifier: String) -> Attachment {
		let attachment = Attachment(context: viewContext)
		attachment.id = identifier
		
		return attachment
	}
	
	func createTempMessage(msg: String, in room: Room, for loggedUser: LoggedUser) -> String {
		let id = String.random(17)
		let message = message(id: id) ?? createMessage(id: id)
		
		message.id = id
		message.ts = Date()
		message.room = room
		message.status = "temp" // TODO:
		message.msg = msg
		message.groupable = true
		
		let user = user(id: loggedUser.id) ?? createUser(id: loggedUser.id)
		user.username = loggedUser.username
		user.name = loggedUser.name
		message.user = user
		
		return id
	}
	
	func updateMessage(_ id: String, status: String) {
		let message = message(id: id) ?? createMessage(id: id)
		message.status = status
		
		save()
	}
	
	func remove(_ message: Message) {
		viewContext.delete(message)
		
		save()
	}
	
	func user(id: String) -> User? {
		let user = User(context: viewContext)
		user.id = id
		
		return user
	}
	
	func room(id: String) -> Room? {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		return try? viewContext.fetch(request).first
	}
	
	func message(id: String) -> Message? {
		let request = Message.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		return try? viewContext.fetch(request).first
	}
	
	func attachment(identifier: String) -> Attachment? {
		let request = Attachment.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", identifier)
		
		return try? viewContext.fetch(request).first
	}
	
	func rooms(ids: [String]) -> [Room] {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "ANY id IN %@", ids)
		
		return (try? viewContext.fetch(request)) ?? []
	}
	
	func process(updatedMessage: MessageResponse, in room: Room) {
		let message = message(id: updatedMessage._id) ?? createMessage(id: updatedMessage._id)
		
		let user = user(id: updatedMessage.u._id) ?? createUser(id: updatedMessage.u._id)
		user.name = updatedMessage.u.name
		user.username = updatedMessage.u.username
		
		message.status = "received" // TODO:
		message.id = updatedMessage._id
		message.msg = updatedMessage.msg
		message.room = room
		message.ts = updatedMessage.ts
		message.user = user
		message.t = updatedMessage.t
		message.groupable = updatedMessage.groupable ?? true
		message.editedAt = updatedMessage.editedAt
		message.role = updatedMessage.role
		message.comment = updatedMessage.comment
		
		updatedMessage.attachments?.forEach { attachment in
			process(updatedAttachment: attachment, in: message)
		}
	}
	
	func process(updatedAttachment: AttachmentResponse, in message: Message) {
		let identifier = updatedAttachment.imageURL ?? updatedAttachment.audioURL
		
		guard let identifier = identifier?.absoluteString ?? updatedAttachment.title else {
			return
		}
		
		let attachment = attachment(identifier: identifier) ?? createAttachment(identifier: identifier)
		
		attachment.imageURL = updatedAttachment.imageURL
		attachment.msg = updatedAttachment.description
		attachment.message = message
		attachment.width = updatedAttachment.dimensions?.width ?? 0
		attachment.height = updatedAttachment.dimensions?.height ?? 0
	}
	
	func process(subscription: SubscriptionsResponse.Subscription?, in updatedRoom: RoomsResponse.Room) {
		let room = room(id: updatedRoom._id) ?? createRoom(id: updatedRoom._id)
		
		room.name = updatedRoom.name
		room.fname = updatedRoom.fname
		room.updatedAt = updatedRoom._updatedAt
		room.t = updatedRoom.t
		room.usernames = updatedRoom.usernames
		room.uids = updatedRoom.uids
		room.prid = updatedRoom.prid
		room.isReadOnly = updatedRoom.ro ?? false
		room.encrypted = updatedRoom.encrypted ?? false
		room.teamMain = updatedRoom.teamMain ?? false
		room.archived = updatedRoom.archived ?? false
		room.broadcast = updatedRoom.broadcast ?? false
		room.open = subscription?.open ?? true
		
		if let subscription {
			room.alert = subscription.alert
			room.name = room.name ?? subscription.name
			room.fname = room.fname ?? subscription.fname
			room.unread = Int32(subscription.unread)
		}
		
		if let lastMessage = updatedRoom.lastMessage?.value {
			process(updatedMessage: lastMessage, in: room)
		}
		
		let lastRoomUpdate = updatedRoom.lm ?? updatedRoom.ts ?? updatedRoom._updatedAt
		
		if let lr = subscription?.lr, let lastRoomUpdate {
			room.ts = max(lr, lastRoomUpdate)
		} else {
			room.ts = lastRoomUpdate
		}
		
		save()
	}
	
	func process(subscription: SubscriptionsResponse.Subscription) {
		let room = room(id: subscription.rid) ?? createRoom(id: subscription.rid)
		
		room.alert = subscription.alert
		room.name = room.name ?? subscription.name
		room.fname = room.fname ?? subscription.fname
		room.unread = Int32(subscription.unread)
		room.open = subscription.open ?? true
		
		if let lr = subscription.lr, let lastRoomUpdate = room.ts {
			room.ts = max(lr, lastRoomUpdate)
		}
		
		save()
	}
	
	func remove() {
		guard let url = container.persistentStoreDescriptions.first?.url else {
			return
		}
		
		do {
			try container.persistentStoreCoordinator.destroyPersistentStore(at: url, type: .sqlite)
		} catch {
			print(error)
		}
	}
}
