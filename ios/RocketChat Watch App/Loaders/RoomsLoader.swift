import CoreData
import Combine
import Foundation

protocol RoomsLoading {
	func start()
	func stop()
}

final class RoomsLoader {
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	@Dependency private var serversDB: ServersDatabase
	
	private var timer: Timer?
	private var cancellable = CancelBag()
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
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
				self?.scheduledLoadRooms()
			}
		} receiveValue: { (roomsResponse, subscriptionsResponse) in
			let rooms = roomsResponse.update
			let subscriptions = subscriptionsResponse.update
			
			for room in rooms {
				let subscription = subscriptions.find(withRoomID: room._id)
				
				self.database.process(subscription: subscription, in: room)
			}
			
			for subscription in subscriptions {
				self.database.process(subscription: subscription)
			}
			
			self.scheduledLoadRooms()
			
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
