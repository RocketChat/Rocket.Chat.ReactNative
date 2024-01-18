import CoreData
import Combine
import Foundation

protocol MessagesLoading {
	func start(on roomID: String)
	func loadMore(from date: Date)
	
	func stop()
}

final class MessagesLoader {
	private var timer: Timer?
	private var cancellable = CancelBag()
	
	private let client: RocketChatClientProtocol
	private let database: Database
	private let serversDB: ServersDatabase
	
	private var roomID: String?
	
	init(
		client: RocketChatClientProtocol,
		database: Database,
		serversDB: ServersDatabase
	) {
		self.client = client
		self.database = database
		self.serversDB = serversDB
	}
	
	private func scheduledSyncMessages(in room: Room, from date: Date) {
		timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
			self?.syncMessages(in: room, from: date)
		}
	}
	
	private func syncMessages(in room: Room, from date: Date) {
		guard let rid = room.id else { return }
		
		let newUpdatedSince = Date()
		
		client.syncMessages(rid: rid, updatedSince: date)
			.receive(on: DispatchQueue.main)
			.sink { completion in
				if case .failure(let error) = completion {
					print(error)
				}
			} receiveValue: { [weak self] messagesResponse in
				let messages = messagesResponse.result.updated
				
				room.updatedSince = newUpdatedSince
				
				for message in messages {
					self?.database.process(updatedMessage: message, in: room)
				}
				
				self?.scheduledSyncMessages(in: room, from: newUpdatedSince)
				
				self?.markAsRead(in: room)
			}
			.store(in: &cancellable)
	}
	
	private func loadMessages(in room: Room, from date: Date) {
		guard let rid = room.id else { return }
		
		client.getHistory(rid: rid, t: room.t ?? "", latest: date)
			.receive(on: DispatchQueue.main)
			.sink { completion in
				if case .failure(let error) = completion {
					print(error)
				}
			} receiveValue: { [weak self] messagesResponse in
				let messages = messagesResponse.messages
				
				if let lastMessage = messages.last, self?.database.message(id: lastMessage._id) == nil, messages.count == 20 {
					room.hasMoreMessages = true
				}
				
				for message in messages {
					self?.database.process(updatedMessage: message, in: room)
				}
			}
			.store(in: &cancellable)
	}
	
	private func markAsRead(in room: Room) {
		guard (room.unread > 0 || room.alert), let rid = room.id else {
			return
		}
		
		client.sendRead(rid: rid)
			.receive(on: DispatchQueue.main)
			.sink { completion in
				if case .failure(let error) = completion {
					print(error)
				}
			} receiveValue: { _ in
				
			}
			.store(in: &cancellable)
	}
}

extension MessagesLoader: MessagesLoading {
	func start(on roomID: String) {
		stop()
		
		self.roomID = roomID
		
		guard let room = database.room(id: roomID) else { return }
		
		if let updatedSince = room.updatedSince {
			loadMessages(in: room, from: updatedSince)
			syncMessages(in: room, from: updatedSince)
		} else {
			loadMessages(in: room, from: .now)
			syncMessages(in: room, from: .now)
		}
	}
	
	func loadMore(from date: Date) {
		guard let roomID, let room = database.room(id: roomID) else { return }
		
		loadMessages(in: room, from: date)
	}
	
	func stop() {
		timer?.invalidate()
		cancellable.cancelAll()
	}
}
