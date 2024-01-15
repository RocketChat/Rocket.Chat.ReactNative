import Foundation
import WatchConnectivity

enum ConnectionError: Error {
  case needsUnlock
  case decoding(Error)
}

protocol Connection {
  func sendMessage(completionHandler: @escaping (Result<WatchMessage, ConnectionError>) -> Void)
}

final class WatchConnection: NSObject {
  private let session: WCSession
  
  init(session: WCSession = .default) {
    self.session = session
    super.init()
    session.delegate = self
    session.activate()
  }
  
  private func scheduledSendMessage(completionHandler: @escaping (Result<WatchMessage, ConnectionError>) -> Void) {
    Timer.scheduledTimer(withTimeInterval: 1, repeats: false) { [weak self] _ in
      self?.sendMessage(completionHandler: completionHandler)
    }
  }
}

// MARK: - WCSessionDelegate

extension WatchConnection: WCSessionDelegate {
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    
  }
}

// MARK: - Connection

extension WatchConnection: Connection {
  func sendMessage(completionHandler: @escaping (Result<WatchMessage, ConnectionError>) -> Void) {
    guard session.activationState == .activated else {
      scheduledSendMessage(completionHandler: completionHandler)
      return
    }
    
    guard !session.iOSDeviceNeedsUnlockAfterRebootForReachability else {
      completionHandler(.failure(.needsUnlock))
      return
    }
    
    guard session.isReachable else {
      scheduledSendMessage(completionHandler: completionHandler)
      return
    }
    
    session.sendMessage([:]) { dictionary in
      do {
        let data = try JSONSerialization.data(withJSONObject: dictionary)
        let message = try JSONDecoder().decode(WatchMessage.self, from: data)
        
        completionHandler(.success(message))
      } catch {
        completionHandler(.failure(.decoding(error)))
      }
    }
  }
}
