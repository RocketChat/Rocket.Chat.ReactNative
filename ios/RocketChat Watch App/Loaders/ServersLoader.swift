import Combine
import Foundation
import WatchConnectivity

enum ServersLoadingError: Error, Equatable {
	case unactive
	case unreachable
	case locked
	case undecodable(Error)
	
	static func == (lhs: ServersLoadingError, rhs: ServersLoadingError) -> Bool {
		switch (lhs, rhs) {
		case (.unactive, .unactive), (.unreachable, .unreachable), (.locked, .locked), (.undecodable, .undecodable):
			return true
		default:
			return false
		}
	}
}

protocol ServersLoading {
	func loadServers() -> AnyPublisher<Void, ServersLoadingError>
}

final class ServersLoader: NSObject {
	@Dependency private var database: ServersDatabase
	
	private let session: WatchSessionProtocol
	
	init(session: WatchSessionProtocol = RetriableWatchSession()) {
		self.session = session
		super.init()
	}
}

// MARK: - ServersLoading

extension ServersLoader: ServersLoading {
	func loadServers() -> AnyPublisher<Void, ServersLoadingError> {
		Future<Void, ServersLoadingError> { [self] promise in
			session.sendMessage { result in
				switch result {
				case .success(let message):
					for server in message.servers {
						DispatchQueue.main.async {						
							self.database.process(updatedServer: server)
						}
					}
					
					promise(.success(()))
				case .failure(let error):
					promise(.failure(error))
				}
			}
		}
			.eraseToAnyPublisher()
	}
}
