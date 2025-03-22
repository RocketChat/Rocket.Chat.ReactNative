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
	
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	@Dependency private var serversDB: ServersDatabase
	
	private var roomID: String?
	
	private func scheduledSyncMessages(in room: Room, from date: Date) {
		timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
			self?.syncMessages(in: room, from: date)
		}
	}
	
	private func syncMessages(in room: Room, from date: Date) {
		guard let rid = room.rid, let roomID = room.id else { return }
		
		let newUpdatedSince = Date()
		
		client.syncMessages(rid: rid, updatedSince: date)
			.receive(on: DispatchQueue.main)
			.sink { [weak self] completion in
				if case .failure = completion {
					self?.scheduledSyncMessages(in: room, from: newUpdatedSince)
				}
			} receiveValue: { [weak self] messagesResponse in
				self?.database.handleMessagesResponse(messagesResponse, in: roomID, newUpdatedSince: newUpdatedSince)
				
				self?.scheduledSyncMessages(in: room, from: newUpdatedSince)
				
				self?.markAsRead(in: room)
			}
			.store(in: &cancellable)
	}
	
	private func loadMessages(in room: Room, from date: Date) {
		guard let rid = room.rid, let roomID = room.id else { return }
		
		client.getHistory(rid: rid, t: room.t ?? "", latest: date)
			.receive(on: DispatchQueue.main)
			.sink { completion in
				if case .failure(let error) = completion {
					print(error)
				}
			} receiveValue: { [weak self] messagesResponse in
				self?.database.handleHistoryResponse(messagesResponse, in: roomID)
			}
			.store(in: &cancellable)
	}
	
	private func markAsRead(in room: Room) {
		guard (room.unread > 0 || room.alert), let rid = room.rid, let roomID = room.id else {
			return
		}
		
		client.sendRead(rid: rid)
			.receive(on: DispatchQueue.main)
			.sink { completion in
				if case .failure(let error) = completion {
					print(error)
				}
			} receiveValue: { [weak self] readResponse in
				self?.database.handleReadResponse(readResponse, in: roomID)
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
