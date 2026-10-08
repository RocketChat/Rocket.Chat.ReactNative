import Foundation
import Network

/// Loopback HTTP/1.1 server that forwards every request to a single HTTPS upstream and accepts the
/// upstream certificate unconditionally.
///
/// WKWebView validates TLS inside its own networking process, so there is no public API to accept a
/// self-signed certificate for a page it loads, and URLSession in this process is bound by App
/// Transport Security, which re-evaluates server trust even when the delegate returns a credential.
/// Network.framework is not, so each request is relayed over an NWConnection whose verify block
/// accepts the certificate. Serving the page from `http://127.0.0.1:<port>` keeps it a secure context
/// (getUserMedia, WebRTC).
///
/// Scope: HTTP/1.1 requests with `Content-Length` bodies, one upstream connection per request
/// (`Connection: close` both ways), response bodies relayed verbatim so streaming (SSE) works.
/// No WebSocket upgrades. Every piece of mutable state lives on `PexipLoopbackProxy.queue`.
@objc(PexipLoopbackProxy)
public final class PexipLoopbackProxy: NSObject {
    private static let queue = DispatchQueue(label: "chat.rocket.ios.pexipLoopbackProxy")
    private static var server: ProxyServer?

    /// Resolves with the local origin (`http://127.0.0.1:<port>`) that mirrors `origin`.
    /// Starting again for the same origin reuses the running server.
    @objc public static func start(withUpstreamOrigin origin: String, completion: @escaping (String?, Error?) -> Void) {
        queue.async {
            guard let upstream = Upstream(origin: origin) else {
                completion(nil, ProxyError.invalidOrigin(origin))
                return
            }
            if let running = server, running.upstream.origin == upstream.origin, let localOrigin = running.localOrigin {
                completion(localOrigin, nil)
                return
            }
            server?.stop()
            let next = ProxyServer(upstream: upstream, queue: queue)
            server = next
            next.start { result in
                switch result {
                case .success(let localOrigin):
                    completion(localOrigin, nil)
                case .failure(let error):
                    if server === next {
                        server = nil
                    }
                    completion(nil, error)
                }
            }
        }
    }

    @objc public static func stop() {
        queue.async {
            server?.stop()
            server = nil
        }
    }
}

enum ProxyError: LocalizedError {
    case invalidOrigin(String)
    case stopped

    var errorDescription: String? {
        switch self {
        case .invalidOrigin(let origin):
            return "Pexip proxy needs an https origin, got \(origin)"
        case .stopped:
            return "Pexip proxy stopped before it was ready"
        }
    }
}

struct Upstream {
    /// Normalized `https://host[:port]`.
    let origin: String
    let host: String
    let port: UInt16

    /// Value for the Host header: the port only when it is not the https default.
    var hostHeader: String {
        port == 443 ? host : "\(host):\(port)"
    }

    init?(origin: String) {
        guard let components = URLComponents(string: origin),
              components.scheme?.lowercased() == "https",
              let host = components.host?.lowercased(), !host.isEmpty else {
            return nil
        }
        let port = components.port.map(UInt16.init(clamping:)) ?? 443
        self.host = host
        self.port = port
        self.origin = "https://\(host)" + (port == 443 ? "" : ":\(port)")
    }
}

private enum Limits {
    static let maxRequestHead = 64 * 1024
    static let maxRequestBody = 16 * 1024 * 1024
    static let maxResponseHead = 256 * 1024
    static let readChunk = 64 * 1024
}

private let headTerminator = Data("\r\n\r\n".utf8)

final class ProxyServer {
    let upstream: Upstream
    let queue: DispatchQueue
    private(set) var localOrigin: String?
    private var listener: NWListener?
    private var connections: [ObjectIdentifier: ClientConnection] = [:]
    private var stopped = false

    init(upstream: Upstream, queue: DispatchQueue) {
        self.upstream = upstream
        self.queue = queue
    }

    func start(completion: @escaping (Result<String, Error>) -> Void) {
        let parameters = NWParameters.tcp
        parameters.requiredLocalEndpoint = NWEndpoint.hostPort(host: .ipv4(.loopback), port: .any)
        let listener: NWListener
        do {
            listener = try NWListener(using: parameters)
        } catch {
            completion(.failure(error))
            return
        }
        self.listener = listener

        var completed = false
        listener.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state {
            case .ready:
                guard !completed, let port = listener.port else { return }
                completed = true
                let localOrigin = "http://127.0.0.1:\(port.rawValue)"
                self.localOrigin = localOrigin
                completion(.success(localOrigin))
            case .failed(let error):
                self.stop()
                if !completed {
                    completed = true
                    completion(.failure(error))
                }
            case .cancelled:
                if !completed {
                    completed = true
                    completion(.failure(ProxyError.stopped))
                }
            default:
                break
            }
        }
        listener.newConnectionHandler = { [weak self] connection in
            self?.accept(connection)
        }
        listener.start(queue: queue)
    }

    func stop() {
        guard !stopped else { return }
        stopped = true
        listener?.cancel()
        listener = nil
        for connection in Array(connections.values) {
            connection.close()
        }
        connections.removeAll()
        localOrigin = nil
    }

    private func accept(_ connection: NWConnection) {
        guard !stopped else {
            connection.cancel()
            return
        }
        let client = ClientConnection(connection: connection, server: self, queue: queue)
        connections[ObjectIdentifier(client)] = client
        client.start()
    }

    func remove(_ client: ClientConnection) {
        connections.removeValue(forKey: ObjectIdentifier(client))
    }

    /// TLS connection to the upstream that accepts whatever certificate it presents.
    func makeUpstreamConnection() -> NWConnection {
        let tls = NWProtocolTLS.Options()
        let security = tls.securityProtocolOptions
        sec_protocol_options_set_tls_server_name(security, upstream.host)
        sec_protocol_options_add_tls_application_protocol(security, "http/1.1")
        sec_protocol_options_set_verify_block(security, { _, _, complete in
            complete(true)
        }, queue)
        let parameters = NWParameters(tls: tls)
        return NWConnection(host: NWEndpoint.Host(upstream.host), port: NWEndpoint.Port(rawValue: upstream.port) ?? 443, using: parameters)
    }

    /// `http://127.0.0.1:<port>/x` -> `https://host/x` (Origin and Referer sent by the page)
    func rewriteToUpstream(_ value: String) -> String {
        guard let localOrigin = localOrigin, value.hasPrefix(localOrigin) else { return value }
        return upstream.origin + value.dropFirst(localOrigin.count)
    }

    /// `https://host/x` -> `http://127.0.0.1:<port>/x` (Location sent by the server)
    func rewriteToLocal(_ value: String) -> String {
        guard let localOrigin = localOrigin, value.lowercased().hasPrefix(upstream.origin) else { return value }
        return localOrigin + value.dropFirst(upstream.origin.count)
    }
}

final class ClientConnection {
    private let connection: NWConnection
    private weak var server: ProxyServer?
    private let queue: DispatchQueue
    private var requestBuffer = Data()
    private var upstream: NWConnection?
    private var responseBuffer = Data()
    private var responseHeadSent = false
    private var isHeadRequest = false
    private var closed = false

    init(connection: NWConnection, server: ProxyServer, queue: DispatchQueue) {
        self.connection = connection
        self.server = server
        self.queue = queue
    }

    func start() {
        connection.stateUpdateHandler = { [weak self] state in
            switch state {
            case .failed, .cancelled:
                self?.close()
            default:
                break
            }
        }
        connection.start(queue: queue)
        receiveRequest()
    }

    func close() {
        guard !closed else { return }
        closed = true
        upstream?.cancel()
        upstream = nil
        connection.cancel()
        server?.remove(self)
    }

    // MARK: - Client -> upstream

    private func receiveRequest() {
        connection.receive(minimumIncompleteLength: 1, maximumLength: Limits.readChunk) { [weak self] data, _, isComplete, error in
            guard let self = self, !self.closed, self.upstream == nil else { return }
            if let data = data, !data.isEmpty {
                self.requestBuffer.append(data)
                self.forwardRequestIfComplete()
            }
            if isComplete || error != nil {
                self.close()
                return
            }
            if self.upstream != nil {
                self.drainClient()
            } else {
                self.receiveRequest()
            }
        }
    }

    /// Nothing more is expected from the client; reading on just detects it going away.
    private func drainClient() {
        connection.receive(minimumIncompleteLength: 1, maximumLength: Limits.readChunk) { [weak self] _, _, isComplete, error in
            guard let self = self, !self.closed else { return }
            if isComplete || error != nil {
                self.close()
                return
            }
            self.drainClient()
        }
    }

    private func forwardRequestIfComplete() {
        guard let server = server else { return }
        guard let terminator = requestBuffer.range(of: headTerminator) else {
            if requestBuffer.count > Limits.maxRequestHead {
                respondAndClose(status: 431, reason: "Request Header Fields Too Large")
            }
            return
        }
        let headEnd = terminator.upperBound
        guard let head = HTTPRequestHead(data: requestBuffer.subdata(in: 0..<terminator.lowerBound)) else {
            respondAndClose(status: 400, reason: "Bad Request")
            return
        }
        if head.isChunked {
            respondAndClose(status: 411, reason: "Length Required")
            return
        }
        let bodyLength = head.contentLength ?? 0
        if bodyLength < 0 || bodyLength > Limits.maxRequestBody {
            respondAndClose(status: 413, reason: "Payload Too Large")
            return
        }
        guard requestBuffer.count >= headEnd + bodyLength else { return }
        let body = requestBuffer.subdata(in: headEnd..<(headEnd + bodyLength))
        requestBuffer.removeAll()

        guard let target = head.originFormTarget else {
            respondAndClose(status: 400, reason: "Bad Request")
            return
        }
        var request = "\(head.method) \(target) HTTP/1.1\r\n"
        request += "Host: \(server.upstream.hostHeader)\r\n"
        for header in head.headers {
            let name = header.name.lowercased()
            if ProxyHeaders.droppedFromRequests.contains(name) { continue }
            var value = header.value
            if name == "origin" || name == "referer" {
                value = server.rewriteToUpstream(value)
            }
            request += "\(header.name): \(value)\r\n"
        }
        if !body.isEmpty || head.contentLength != nil {
            request += "Content-Length: \(body.count)\r\n"
        }
        request += "Connection: close\r\n\r\n"

        isHeadRequest = head.method == "HEAD"
        let upstream = server.makeUpstreamConnection()
        self.upstream = upstream
        upstream.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state {
            case .ready:
                upstream.send(content: Data(request.utf8) + body, completion: .contentProcessed { [weak self] error in
                    if error != nil {
                        self?.upstreamFailed()
                    }
                })
                self.receiveResponse()
            case .failed, .cancelled:
                self.upstreamFailed()
            case .waiting:
                // No route to the host; waiting would hang the WebView until its own timeout.
                self.upstreamFailed()
            default:
                break
            }
        }
        upstream.start(queue: queue)
    }

    // MARK: - Upstream -> client

    private func receiveResponse() {
        guard let upstream = upstream else { return }
        upstream.receive(minimumIncompleteLength: 1, maximumLength: Limits.readChunk) { [weak self] data, _, isComplete, error in
            guard let self = self, !self.closed, self.upstream === upstream else { return }
            if let data = data, !data.isEmpty {
                self.relay(data)
            }
            if self.closed { return }
            if error != nil {
                self.upstreamFailed()
                return
            }
            if isComplete {
                if self.responseHeadSent {
                    self.finishAndClose()
                } else {
                    self.upstreamFailed()
                }
                return
            }
            self.receiveResponse()
        }
    }

    private func relay(_ data: Data) {
        if responseHeadSent {
            send(data)
            return
        }
        responseBuffer.append(data)
        guard let terminator = responseBuffer.range(of: headTerminator) else {
            if responseBuffer.count > Limits.maxResponseHead {
                upstreamFailed()
            }
            return
        }
        guard let server = server,
              let rewritten = ProxyHeaders.rewriteResponseHead(responseBuffer.subdata(in: 0..<terminator.lowerBound), server: server) else {
            upstreamFailed()
            return
        }
        responseHeadSent = true
        let rest = responseBuffer.subdata(in: terminator.upperBound..<responseBuffer.count)
        responseBuffer.removeAll()
        send(Data((rewritten + "\r\n\r\n").utf8))
        if !rest.isEmpty && !isHeadRequest {
            send(rest)
        }
    }

    private func upstreamFailed() {
        guard !closed else { return }
        if responseHeadSent {
            // A truncated body makes the WebView treat the load as a network error.
            close()
        } else {
            respondAndClose(status: 502, reason: "Bad Gateway")
        }
    }

    // MARK: - Writing

    private func send(_ data: Data) {
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            if error != nil {
                self?.close()
            }
        })
    }

    private func finishAndClose() {
        connection.send(content: nil, contentContext: .finalMessage, isComplete: true, completion: .contentProcessed { [weak self] _ in
            self?.close()
        })
    }

    private func respondAndClose(status: Int, reason: String) {
        guard !closed else { return }
        upstream?.cancel()
        upstream = nil
        let head = "HTTP/1.1 \(status) \(reason)\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
        send(Data(head.utf8))
        finishAndClose()
    }
}

struct HTTPRequestHead {
    struct Header {
        let name: String
        let value: String
    }

    let method: String
    let target: String
    let headers: [Header]

    init?(data: Data) {
        guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) else { return nil }
        var lines = text.components(separatedBy: "\r\n")
        let requestLine = lines.removeFirst()
        let parts = requestLine.split(separator: " ", omittingEmptySubsequences: true)
        guard parts.count == 3, parts[2].hasPrefix("HTTP/1.") else { return nil }
        method = parts[0].uppercased()
        target = String(parts[1])

        var headers: [Header] = []
        for line in lines where !line.isEmpty {
            guard let colon = line.firstIndex(of: ":") else { return nil }
            let name = line[..<colon].trimmingCharacters(in: .whitespaces)
            let value = line[line.index(after: colon)...].trimmingCharacters(in: .whitespaces)
            guard !name.isEmpty else { return nil }
            headers.append(Header(name: name, value: value))
        }
        self.headers = headers
    }

    func value(_ name: String) -> String? {
        headers.first { $0.name.caseInsensitiveCompare(name) == .orderedSame }?.value
    }

    var contentLength: Int? {
        value("Content-Length").flatMap { Int($0) }
    }

    var isChunked: Bool {
        (value("Transfer-Encoding") ?? "").lowercased().contains("chunked")
    }

    /// Path and query as the upstream expects them; an absolute-form target loses its authority.
    var originFormTarget: String? {
        if target.hasPrefix("/") { return target }
        guard let components = URLComponents(string: target), components.host != nil else { return nil }
        let path = components.percentEncodedPath.isEmpty ? "/" : components.percentEncodedPath
        return path + (components.percentEncodedQuery.map { "?\($0)" } ?? "")
    }
}

enum ProxyHeaders {
    /// Hop-by-hop headers plus the ones the relay sets itself. Dropping Accept-Encoding keeps the
    /// body uncompressed so its framing can be relayed verbatim.
    static let droppedFromRequests: Set<String> = [
        "host", "connection", "keep-alive", "proxy-connection", "transfer-encoding", "te", "trailer", "upgrade",
        "content-length", "accept-encoding"
    ]

    /// Transport-security policies would either pin the page to https or upgrade loopback requests,
    /// so they must not reach the WebView. Framing headers pass through untouched.
    static let droppedFromResponses: Set<String> = [
        "connection", "keep-alive", "upgrade", "strict-transport-security", "content-security-policy",
        "content-security-policy-report-only", "public-key-pins", "alt-svc"
    ]

    /// Rewrites an upstream response head (status line + headers, without the blank line) for the client.
    static func rewriteResponseHead(_ data: Data, server: ProxyServer) -> String? {
        guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) else { return nil }
        var lines = text.components(separatedBy: "\r\n")
        guard !lines.isEmpty, lines[0].hasPrefix("HTTP/1.") else { return nil }
        var head = lines.removeFirst()
        for line in lines where !line.isEmpty {
            guard let colon = line.firstIndex(of: ":") else { continue }
            let name = line[..<colon].trimmingCharacters(in: .whitespaces)
            var value = line[line.index(after: colon)...].trimmingCharacters(in: .whitespaces)
            let lower = name.lowercased()
            if droppedFromResponses.contains(lower) { continue }
            if lower == "location" {
                value = server.rewriteToLocal(value)
            } else if lower == "set-cookie" {
                value = cookieForLoopback(value)
            }
            head += "\r\n\(name): \(value)"
        }
        head += "\r\nConnection: close"
        return head
    }

    /// A `Secure` cookie is dropped over plain http, a `Domain` for the upstream host never matches
    /// 127.0.0.1, and `SameSite=None` is only valid together with `Secure`.
    static func cookieForLoopback(_ value: String) -> String {
        value.split(separator: ";", omittingEmptySubsequences: false)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .enumerated()
            .filter { index, attribute in
                if index == 0 { return true }
                let lower = attribute.lowercased()
                return lower != "secure" && !lower.hasPrefix("domain=") && lower != "samesite=none"
            }
            .map { $0.element }
            .joined(separator: "; ")
    }
}
