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
	
	private var shouldUpdatedDateOnce: Bool
	
	init(server: Server) {
		self.server = server
		self.state = server.updatedSince == nil ? .loading : .loaded
		
		shouldUpdatedDateOnce = !(server.version >= "4")
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
		} receiveValue: { roomsResponse, subscriptionsResponse in
			self.database.handleRoomsResponse(subscriptionsResponse, roomsResponse)
			self.updateServer(to: newUpdatedSince)
			self.scheduledLoadRooms()
		}
		.store(in: &cancellable)
	}
	
	/// This method updates the updateSince timestamp only once in servers with versions below 4.
	///
	/// It is required due to missing events in the rooms and subscriptions
	/// requests in those old versions. We get extra information
	/// by passing a date that is older than the real updatedSince last timestamp.
	private func updateServer(to newUpdatedSince: Date) {
		if !(server.version >= "4") {
			if shouldUpdatedDateOnce {
				server.updatedSince = newUpdatedSince
				serversDB.save()
				shouldUpdatedDateOnce = false
			}
		} else {
			server.updatedSince = newUpdatedSince
			serversDB.save()
		}
	}
	
	private func observeContext() {
		NotificationCenter.default.publisher(for: .NSManagedObjectContextDidSave)
			.receive(on: DispatchQueue.main)
			.sink { [database] notification in
				if let context = notification.object as? NSManagedObjectContext {
					if database.has(context: context) {
						self.state = .loaded
					}
				}
			}
			.store(in: &cancellable)
	}
}

extension RoomsLoader: RoomsLoading {
	func start() {
		stop()
		
		loadRooms()
		observeContext()
	}
	
	func stop() {
		timer?.invalidate()
		cancellable.cancelAll()
	}
}

extension RoomsLoader {
	enum State {
		case loaded
		case loading
		case error
	}
}

private extension String {
	static func >=(lhs: String, rhs: String) -> Bool {
		lhs.compare(rhs, options: .numeric) == .orderedDescending || lhs.compare(rhs, options: .numeric) == .orderedSame
	}
}
