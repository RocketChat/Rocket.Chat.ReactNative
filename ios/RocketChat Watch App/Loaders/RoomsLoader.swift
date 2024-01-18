import CoreData
import Combine
import Foundation

protocol RoomsLoading {
	func start(in url: URL)
	func stop()
}

final class RoomsLoader {
	private var timer: Timer?
	private var cancellable = CancelBag()
	
	private let client: RocketChatClientProtocol
	private let database: Database
	private let serversDB: ServersDatabase
	
	init(client: RocketChatClientProtocol, database: Database, serversDB: ServersDatabase) {
		self.client = client
		self.database = database
		self.serversDB = serversDB
	}
	
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
		.sink { completion in
			if case .failure(let error) = completion {
				// TODO: LOGOUT
				print(error)
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
		guard let server = serversDB.server(url: url) else { return }
		
		loadRooms(in: server)
	}
	
	func stop() {
		timer?.invalidate()
		cancellable.cancelAll()
	}
}
