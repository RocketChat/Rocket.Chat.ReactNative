import Combine
import Foundation

protocol RocketChatClientProtocol {
	var session: URLSession { get }
	
	func authorizedURL(url: URL) -> URL
	func getRooms(updatedSince: Date?) -> AnyPublisher<RoomsResponse, RocketChatError>
	func getSubscriptions(updatedSince: Date?) -> AnyPublisher<SubscriptionsResponse, RocketChatError>
	func getHistory(rid: String, t: String, latest: Date) -> AnyPublisher<HistoryResponse, RocketChatError>
	func syncMessages(rid: String, updatedSince: Date) -> AnyPublisher<MessagesResponse, RocketChatError>
	func sendMessage(id: String, rid: String, msg: String) -> AnyPublisher<SendMessageResponse, RocketChatError>
	func sendRead(rid: String) -> AnyPublisher<ReadResponse, RocketChatError>
}

final class RocketChatClient: NSObject {
	@Dependency private var errorActionHandler: ErrorActionHandling
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
	}
	
	lazy var session = URLSession(
		configuration: .default,
		delegate: URLSesionClientCertificateHandling(
			certificate: server.certificate,
			password: server.password
		),
		delegateQueue: nil
	)
	
	private var adapters: [RequestAdapter] {
		[
			TokenAdapter(server: server),
			JSONAdapter()
		]
	}
	
	private func dataTask<T: Request>(for request: T) -> AnyPublisher<T.Response, RocketChatError> {
		let url = server.url.appending(path: request.path).appending(queryItems: request.queryItems)
		
		var urlRequest = adapters.reduce(URLRequest(url: url), { $1.adapt($0) })
		urlRequest.httpMethod = request.method.rawValue
		urlRequest.httpBody = request.body
		
		return session.dataTaskPublisher(for: urlRequest)
			.tryMap { data, response in
				if let response = response as? HTTPURLResponse, response.statusCode == 401 {
					throw RocketChatError.unauthorized
				}
				
				if let response = try? data.decode(T.Response.self) {
					return response
				}
				
				let response = try data.decode(ErrorResponse.self)
				throw RocketChatError.server(response: response)
			}
			.mapError { [weak self] error in
				guard let error = error as? RocketChatError else {
					return .unknown
				}
				
				self?.errorActionHandler.handle(error: error)
				return error
			}
			.eraseToAnyPublisher()
	}
}

extension RocketChatClient: RocketChatClientProtocol {
	func authorizedURL(url: URL) -> URL {
		adapters.reduce(server.url.appending(path: url.relativePath), { $1.adapt($0) })
	}
	
	func getRooms(updatedSince: Date?) -> AnyPublisher<RoomsResponse, RocketChatError> {
		let request = RoomsRequest(updatedSince: updatedSince)
		return dataTask(for: request)
	}
	
	func getSubscriptions(updatedSince: Date?) -> AnyPublisher<SubscriptionsResponse, RocketChatError> {
		let request = SubscriptionsRequest(updatedSince: updatedSince)
		return dataTask(for: request)
	}
	
	func getHistory(rid: String, t: String, latest: Date) -> AnyPublisher<HistoryResponse, RocketChatError> {
		let request = HistoryRequest(roomId: rid, roomType: t, latest: latest)
		return dataTask(for: request)
	}
	
	func syncMessages(rid: String, updatedSince: Date) -> AnyPublisher<MessagesResponse, RocketChatError> {
		let request = MessagesRequest(lastUpdate: updatedSince, roomId: rid)
		return dataTask(for: request)
	}
	
	func sendMessage(id: String, rid: String, msg: String) -> AnyPublisher<SendMessageResponse, RocketChatError> {
		let request = SendMessageRequest(id: id, rid: rid, msg: msg)
		return dataTask(for: request)
	}
	
	func sendRead(rid: String) -> AnyPublisher<ReadResponse, RocketChatError> {
		let request = ReadRequest(rid: rid)
		return dataTask(for: request)
	}
}
