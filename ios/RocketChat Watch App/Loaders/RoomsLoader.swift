import CoreData
import Combine
import Foundation

protocol RoomsLoading {
	func start()
	func stop()
}

final class RoomsLoader: ObservableObject {
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	@Dependency private var serversDB: ServersDatabase
	
	@Published private(set) var state: State
	
	private var timer: Timer?
	private var cancellable = CancelBag()
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
		self.state = server.updatedSince == nil ? .loading : .loaded
	}
	
	private func scheduledLoadRooms() {
		timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
			self?.loadRooms()
		}
	}
	
	private func loadRooms() {
		let newUpdatedSince = Date()
		
		let updatedSince = server.updatedSince
		
		Publishers.Zip(
			client.getRooms(updatedSince: updatedSince),
			client.getSubscriptions(updatedSince: updatedSince)
		)
		.receive(on: DispatchQueue.main)
		.sink { [weak self] completion in
			if case .failure = completion {
				if self?.state == .loading { self?.state = .error }
				self?.scheduledLoadRooms()
			}
		} receiveValue: { (roomsResponse, subscriptionsResponse) in
			let rooms = roomsResponse.update
			let subscriptions = subscriptionsResponse.update
			
			let roomIds = rooms.filter { room in !subscriptions.contains { room._id == $0.rid } }.map { $0._id }
			let existingSubs = self.database.rooms(ids: roomIds)
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
				let existingSubscriptions = self.database.rooms(ids: subsIds)
				let subsToUpdate = existingSubscriptions.filter { subscription in mergedSubscriptions.contains { subscription.id == $0.id } }
				let subsToCreate = mergedSubscriptions.filter { subscription in !existingSubscriptions.contains { subscription.id == $0.id } }
				let subsToDelete = existingSubscriptions.filter { subscription in !mergedSubscriptions.contains { subscription.id == $0.id } }
				
				subsToCreate.forEach { subscription in
					self.database.insert(subscription)
				}
				
				subsToUpdate.forEach { subscription in
					if let newRoom = mergedSubscriptions.first(where: { $0.id == subscription.id }) {
						self.database.update(subscription, newRoom)
					}
				}
				
				subsToDelete.forEach { subscription in
					self.database.delete(subscription)
				}
				
				self.database.save()
			}
			
			self.scheduledLoadRooms()
			
			self.state = .loaded
			self.server.updatedSince = newUpdatedSince
			self.serversDB.save()
		}
		.store(in: &cancellable)
	}
}

extension RoomsLoader: RoomsLoading {
	func start() {
		stop()
		
		loadRooms()
	}
	
	func stop() {
		timer?.invalidate()
		cancellable.cancelAll()
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
			_updatedAt: ts
		)
	}
}

extension RoomsLoader {
	enum State {
		case loaded
		case loading
		case error
	}
}
