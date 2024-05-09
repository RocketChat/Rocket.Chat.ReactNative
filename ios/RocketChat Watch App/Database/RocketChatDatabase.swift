import Combine
import CoreData

protocol Database {
	var viewContext: NSManagedObjectContext { get }
	func has(context: NSManagedObjectContext) -> Bool
	
	func room(id: String) -> Room?
	func room(rid: String) -> Room?
	func remove(_ message: Message)
	
	func handleRoomsResponse(_ subscriptionsResponse: SubscriptionsResponse, _ roomsResponse: RoomsResponse)
	func handleHistoryResponse(_ historyResponse: HistoryResponse, in roomID: String)
	func handleMessagesResponse(_ messagesResponse: MessagesResponse, in roomID: String, newUpdatedSince: Date)
	func handleSendMessageResponse(_ sendMessageResponse: SendMessageResponse, in roomID: String)
	func handleSendMessageRequest(_ newMessage: MergedRoom.Message, in roomID: String)
	func handleReadResponse(_ readResponse: ReadResponse, in roomID: String)
	func handleSendMessageError(_ messageID: String)
	
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
	
	func has(context: NSManagedObjectContext) -> Bool {
		context == backgroundContext
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
		container.viewContext.automaticallyMergesChangesFromParent = true
		
		return container
	}()
	
	private lazy var backgroundContext = container.newBackgroundContext()
	
	func remove(_ message: Message) {
		viewContext.delete(message)
		
		do {
			try viewContext.save()
		} catch {
			print(error)
		}
	}
	
	func room(id: String) -> Room? {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		return try? viewContext.fetch(request).first
	}
	
	func room(rid: String) -> Room? {
		let request = Room.fetchRequest()
		request.predicate = NSPredicate(format: "rid == %@", rid)
		
		return try? viewContext.fetch(request).first
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

extension RocketChatDatabase {
	func handleReadResponse(_ readResponse: ReadResponse, in roomID: String) {
		backgroundContext.performBackgroundTask { context in
			let roomDatabase = RoomModel(context: context)
			
			let room = roomDatabase.fetch(id: roomID)
			
			room.alert = false
			room.unread = 0
			
			do {
				try context.save()
			} catch {
				print(error)
			}
		}
	}
	
	func handleSendMessageError(_ messageID: String) {
		backgroundContext.performBackgroundTask { context in
			let messageDatabase = MessageModel(context: context)
			
			if let message = messageDatabase.fetch(id: messageID) {
				message.status = "error"
			}
			
			do {
				try context.save()
			} catch {
				print(error)
			}
		}
	}
	
	func handleSendMessageRequest(_ newMessage: MergedRoom.Message, in roomID: String) {
		backgroundContext.performBackgroundTask { context in
			let roomDatabase = RoomModel(context: context)
			let messageDatabase = MessageModel(context: context)
			
			let room = roomDatabase.fetch(id: roomID)
			
			let message = messageDatabase.upsert(newMessage)
			
			message.status = "temp"
			message.room = room
			
			do {
				try context.save()
			} catch {
				print(error)
			}
		}
	}
	
	func handleSendMessageResponse(_ sendMessageResponse: SendMessageResponse, in roomID: String) {
		let message = sendMessageResponse.message
		
		backgroundContext.performBackgroundTask { context in
			let messageDatabase = MessageModel(context: context)
			let roomDatabase = RoomModel(context: context)
			
			let room = roomDatabase.fetch(id: roomID)
			
			if let newMessage = MergedRoom.Message(from: message) {
				let message = messageDatabase.upsert(newMessage)
				
				message.room = room
			}
			
			do {
				try context.save()
			} catch {
				print(error)
			}
		}
	}
	
	func handleMessagesResponse(_ messagesResponse: MessagesResponse, in roomID: String, newUpdatedSince: Date) {
		let messages = messagesResponse.result.updated
		
		backgroundContext.performBackgroundTask { context in
			let messageDatabase = MessageModel(context: context)
			let roomDatabase = RoomModel(context: context)
			
			let room = roomDatabase.fetch(id: roomID)
			
			for message in messages {
				if let newMessage = MergedRoom.Message(from: message) {
					let message = messageDatabase.upsert(newMessage)
					
					message.room = room
				}
			}
			
			room.updatedSince = newUpdatedSince
			
			do {
				try context.save()
			} catch {
				print(error)
			}
		}
	}
	
	func handleHistoryResponse(_ historyResponse: HistoryResponse, in roomID: String) {
		let messages = historyResponse.messages
		
		backgroundContext.performBackgroundTask { context in
			let messageDatabase = MessageModel(context: context)
			let roomDatabase = RoomModel(context: context)
			
			let room = roomDatabase.fetch(id: roomID)
			
			room.hasMoreMessages = messages.count == HISTORY_MESSAGE_COUNT
			room.synced = true
			
			for message in historyResponse.messages {
				if let newMessage = MergedRoom.Message(from: message) {
					let message = messageDatabase.upsert(newMessage)
					
					message.room = room
				}
			}
			
			do {
				try context.save()
			} catch {
				print(error)
			}
		}
	}
	
	func handleRoomsResponse(_ subscriptionsResponse: SubscriptionsResponse, _ roomsResponse: RoomsResponse) {
		let rooms = roomsResponse.update
		let subscriptions = subscriptionsResponse.update
		
		backgroundContext.performBackgroundTask { context in
			let roomDatabase = RoomModel(context: context)
			
			let roomIds = rooms.filter { room in !subscriptions.contains { room._id == $0.rid } }.map { $0._id }
			
			let existingSubs = roomDatabase.fetch(ids: roomIds)
			let mappedExistingSubs = subscriptions + existingSubs.compactMap { $0.response }
			
			let mergedSubscriptions = mappedExistingSubs.compactMap { subscription in
				let index = rooms.firstIndex { $0._id == subscription.rid }
				
				guard let index else {
					return MergedRoom(subscription, nil)
				}
				
				let room = rooms[index]
				return MergedRoom(subscription, room)
			}
			
			let subsIds = mergedSubscriptions.compactMap { $0.id } + subscriptionsResponse.remove.compactMap { $0._id }
			
			if subsIds.count > 0 {
				let existingSubscriptions = roomDatabase.fetch(ids: subsIds)
				let subsToUpdate = existingSubscriptions.filter { subscription in mergedSubscriptions.contains { subscription.id == $0.id } }
				let subsToCreate = mergedSubscriptions.filter { subscription in !existingSubscriptions.contains { subscription.id == $0.id } }
				let subsToDelete = existingSubscriptions.filter { subscription in !mergedSubscriptions.contains { subscription.id == $0.id } }
				
				subsToCreate.forEach { subscription in
					roomDatabase.upsert(subscription)
				}
				
				subsToUpdate.forEach { subscription in
					if let newRoom = mergedSubscriptions.first(where: { $0.id == subscription.id }) {
						roomDatabase.upsert(newRoom)
					}
				}
				
				subsToDelete.forEach { subscription in
					roomDatabase.delete(subscription)
				}
				
				do {
					try context.save()
				} catch {
					print(error)
				}
			}
		}
	}
}

private extension Room {
	var response: SubscriptionsResponse.Subscription? {
		guard let id, let fname, let t, let rid else {
			return nil
		}
		
		return .init(
			_id: id,
			rid: rid,
			name: name,
			fname: fname,
			t: t,
			unread: Int(unread),
			alert: alert,
			lr: lr,
			open: open,
			_updatedAt: ts,
			hideUnreadStatus: hideUnreadStatus
		)
	}
}

extension NSManagedObjectContext {
	func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void) {
		perform {
			block(self)
		}
	}
}
