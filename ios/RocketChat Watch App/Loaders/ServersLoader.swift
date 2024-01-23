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
	
	private let session: WCSession
	
	init(session: WCSession) {
		self.session = session
		super.init()
		session.delegate = self
		session.activate()
	}
	
	private func sendMessage(completionHandler: @escaping (Result<WatchMessage, ServersLoadingError>) -> Void) {
		print("sendMessage")
		
		guard session.activationState == .activated else {
			completionHandler(.failure(.unactive))
			return
		}
		
		guard !session.iOSDeviceNeedsUnlockAfterRebootForReachability else {
			completionHandler(.failure(.locked))
			return
		}
		
		guard session.isReachable else {
			completionHandler(.failure(.unreachable))
			return
		}
		
		session.sendMessage([:]) { dictionary in
			do {
				let data = try JSONSerialization.data(withJSONObject: dictionary)
				let message = try JSONDecoder().decode(WatchMessage.self, from: data)
				
				completionHandler(.success(message))
			} catch {
				completionHandler(.failure(.undecodable(error)))
			}
		}
	}
}

// MARK: - WCSessionDelegate

extension ServersLoader: WCSessionDelegate {
	func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
		
	}
}

// MARK: - ServersLoading

extension ServersLoader: ServersLoading {
	func loadServers() -> AnyPublisher<Void, ServersLoadingError> {
		Future<Void, ServersLoadingError> { [self] promise in
			sendMessage { result in
				switch result {
				case .success(let message):
					for server in message.servers {
						self.database.process(updatedServer: server)
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
