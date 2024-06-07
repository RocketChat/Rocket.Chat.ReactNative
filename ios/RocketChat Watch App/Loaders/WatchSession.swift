import WatchConnectivity

protocol WatchSessionProtocol {
	func sendMessage(completionHandler: @escaping (Result<WatchMessage, ServersLoadingError>) -> Void)
}

/// Default WatchSession protocol implementation.
final class WatchSession: NSObject, WatchSessionProtocol, WCSessionDelegate {
	private let session: WCSession
	
	init(session: WCSession) {
		self.session = session
		super.init()
		session.delegate = self
		session.activate()
	}
	
	func sendMessage(completionHandler: @escaping (Result<WatchMessage, ServersLoadingError>) -> Void) {
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
	
	func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
		
	}
}

/// Retry decorator for WatchSession protocol.
final class RetriableWatchSession: WatchSessionProtocol {
	private let session: WatchSessionProtocol
	private let retries: Int
	
	init(session: WatchSessionProtocol = DelayableWatchSession(session: WatchSession(session: .default)), retries: Int = 3) {
		self.session = session
		self.retries = retries
	}
	
	func sendMessage(completionHandler: @escaping (Result<WatchMessage, ServersLoadingError>) -> Void) {
		session.sendMessage { [weak self] result in
			guard let self else {
				return
			}
			
			switch result {
			case .success(let message):
				completionHandler(.success(message))
			case .failure where self.retries > 0:
				self.session.sendMessage(completionHandler: completionHandler)
			case .failure(let error):
				completionHandler(.failure(error))
			}
		}
	}
}

/// Delay decorator for WatchSession protocol.
final class DelayableWatchSession: WatchSessionProtocol {
	private let delay: TimeInterval
	private let session: WatchSessionProtocol
	
	init(delay: TimeInterval = 1, session: WatchSessionProtocol) {
		self.delay = delay
		self.session = session
	}
	
	func sendMessage(completionHandler: @escaping (Result<WatchMessage, ServersLoadingError>) -> Void) {
		Timer.scheduledTimer(withTimeInterval: 1, repeats: false) { [weak self] _ in
			guard let self else {
				return
			}
			
			self.session.sendMessage(completionHandler: completionHandler)
		}
	}
}
