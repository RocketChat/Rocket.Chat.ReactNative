import CoreData
import Combine
import Foundation

protocol RoomsLoading {
	func start(in url: URL)
	func stop()
}

final class RoomsLoader {
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	@Dependency private var serversDB: ServersDatabase
	
	private var timer: Timer?
	private var cancellable = CancelBag()
	
	private func scheduledLoadRooms(in server: Server) {
		timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
			self?.loadRooms(in: server)
		}
	}
	
	private func loadRooms(in server: Server) {
		let newUpdatedSince = Date()
		
		let updatedSince = server.updatedSince
		
		Publishers.Zip(
			client.getRooms(updatedSince: updatedSince),
			client.getSubscriptions(updatedSince: updatedSince)
		)
		.receive(on: DispatchQueue.main)
		.sink { [weak self] completion in
			if case .failure = completion {
				self?.scheduledLoadRooms(in: server)
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
			
			self.scheduledLoadRooms(in: server)
			
			server.updatedSince = newUpdatedSince
			self.serversDB.save()
		}
		.store(in: &cancellable)
	}
}

extension RoomsLoader: RoomsLoading {
	func start(in url: URL) {
		stop()
		
		guard let server = serversDB.server(url: url) else { return }
		
		loadRooms(in: server)
	}
	
	func stop() {
		timer?.invalidate()
		cancellable.cancelAll()
	}
}
