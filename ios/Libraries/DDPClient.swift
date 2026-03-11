import Foundation

/// Minimal DDP WebSocket client for listening to Rocket.Chat media-signal events from native iOS.
/// Only implements the subset needed to detect call hangup: connect, login, subscribe, and ping/pong.
final class DDPClient {
    
    private static let TAG = "RocketChat.DDPClient"
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession?
    private var sendCounter = 0
    private var isConnected = false
    
    /// Called for every incoming DDP collection message (e.g. stream-notify-user).
    var onCollectionMessage: (([String: Any]) -> Void)?
    
    // MARK: - Connect
    
    func connect(host: String, completion: @escaping (Bool) -> Void) {
        let wsUrl = Self.buildWebSocketURL(host: host)
        
        guard let url = URL(string: wsUrl) else {
            #if DEBUG
            print("[\(Self.TAG)] Invalid WebSocket URL: \(wsUrl)")
            #endif
            completion(false)
            return
        }
        
        #if DEBUG
        print("[\(Self.TAG)] Connecting to \(wsUrl)")
        #endif
        
        let session = URLSession(configuration: .default)
        let task = session.webSocketTask(with: url)
        
        self.urlSession = session
        self.webSocketTask = task
        task.resume()
        
        listenForMessages()
        
        let connectMsg: [String: Any] = [
            "msg": "connect",
            "version": "1",
            "support": ["1", "pre2", "pre1"]
        ]
        
        send(connectMsg) { [weak self] success in
            if success {
                self?.waitForConnected(timeout: 10.0, completion: completion)
            } else {
                completion(false)
            }
        }
    }
    
    // MARK: - Login
    
    func login(token: String, completion: @escaping (Bool) -> Void) {
        let msg = nextMessage(msg: "method", extra: [
            "method": "login",
            "params": [["resume": token]]
        ])
        
        let msgId = msg["id"] as? String
        
        pendingCallbacks[msgId ?? ""] = { [weak self] data in
            self?.pendingCallbacks.removeValue(forKey: msgId ?? "")
            let hasError = data["error"] != nil
            #if DEBUG
            if hasError {
                print("[\(Self.TAG)] Login failed: \(data["error"] ?? "unknown")")
            } else {
                print("[\(Self.TAG)] Login succeeded")
            }
            #endif
            completion(!hasError)
        }
        
        send(msg) { success in
            if !success { completion(false) }
        }
    }
    
    // MARK: - Subscribe
    
    func subscribe(name: String, params: [Any], completion: @escaping (Bool) -> Void) {
        let msg = nextMessage(msg: "sub", extra: [
            "name": name,
            "params": params
        ])
        
        let msgId = msg["id"] as? String
        
        pendingCallbacks[msgId ?? ""] = { [weak self] _ in
            self?.pendingCallbacks.removeValue(forKey: msgId ?? "")
            #if DEBUG
            print("[\(Self.TAG)] Subscribed to \(name)")
            #endif
            completion(true)
        }
        
        send(msg) { success in
            if !success { completion(false) }
        }
    }
    
    // MARK: - Disconnect
    
    func disconnect() {
        #if DEBUG
        print("[\(Self.TAG)] Disconnecting")
        #endif
        isConnected = false
        pendingCallbacks.removeAll()
        connectedCallback = nil
        onCollectionMessage = nil
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        urlSession?.invalidateAndCancel()
        urlSession = nil
    }
    
    // MARK: - Private
    
    private var pendingCallbacks: [String: ([String: Any]) -> Void] = [:]
    private var connectedCallback: ((Bool) -> Void)?
    
    private func nextMessage(msg: String, extra: [String: Any] = [:]) -> [String: Any] {
        sendCounter += 1
        var dict: [String: Any] = ["msg": msg, "id": "ddp-\(sendCounter)"]
        for (key, value) in extra {
            dict[key] = value
        }
        return dict
    }
    
    private func send(_ dict: [String: Any], completion: @escaping (Bool) -> Void) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let string = String(data: data, encoding: .utf8) else {
            completion(false)
            return
        }
        
        webSocketTask?.send(.string(string)) { error in
            if let error = error {
                #if DEBUG
                print("[\(Self.TAG)] Send error: \(error.localizedDescription)")
                #endif
                completion(false)
            } else {
                completion(true)
            }
        }
    }
    
    private func waitForConnected(timeout: TimeInterval, completion: @escaping (Bool) -> Void) {
        connectedCallback = completion
        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) { [weak self] in
            guard let self = self, let cb = self.connectedCallback else { return }
            self.connectedCallback = nil
            #if DEBUG
            print("[\(Self.TAG)] Connect timeout")
            #endif
            cb(false)
        }
    }
    
    private func listenForMessages() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text)
                default:
                    break
                }
                self.listenForMessages()
                
            case .failure(let error):
                #if DEBUG
                print("[\(Self.TAG)] Receive error: \(error.localizedDescription)")
                #endif
            }
        }
    }
    
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return
        }
        
        let msg = json["msg"] as? String
        
        switch msg {
        case "connected":
            isConnected = true
            if let cb = connectedCallback {
                connectedCallback = nil
                cb(true)
            }
            
        case "ping":
            send(["msg": "pong"]) { _ in }
            
        case "result":
            if let id = json["id"] as? String, let cb = pendingCallbacks[id] {
                cb(json)
            }
            
        case "ready":
            if let subs = json["subs"] as? [String], let first = subs.first, let cb = pendingCallbacks[first] {
                cb(json)
            }
            
        case "changed", "added", "removed":
            if let collection = json["collection"] as? String {
                var message = json
                message["collection"] = collection
                onCollectionMessage?(message)
            }
            
        case "nosub":
            if let id = json["id"] as? String, let cb = pendingCallbacks[id] {
                cb(json)
            }
            
        default:
            if let collection = json["collection"] as? String {
                onCollectionMessage?(json)
                _ = collection
            }
        }
    }
    
    // MARK: - URL Helpers
    
    private static func buildWebSocketURL(host: String) -> String {
        var cleaned = host
        
        if cleaned.hasSuffix("/") {
            cleaned = String(cleaned.dropLast())
        }
        
        let useSsl: Bool
        if cleaned.hasPrefix("https://") {
            useSsl = true
            cleaned = String(cleaned.dropFirst("https://".count))
        } else if cleaned.hasPrefix("http://") {
            useSsl = false
            cleaned = String(cleaned.dropFirst("http://".count))
        } else {
            useSsl = true
        }
        
        let scheme = useSsl ? "wss" : "ws"
        return "\(scheme)://\(cleaned)/websocket"
    }
}
