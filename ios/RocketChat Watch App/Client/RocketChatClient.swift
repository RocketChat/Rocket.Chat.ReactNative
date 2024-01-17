import Combine
import Foundation

protocol RocketChatClientProtocol {
    func authorizedURL(url: URL) -> URL
    func getRooms(updatedSince: Date?) -> AnyPublisher<RoomsResponse, RocketChatError>
    func getSubscriptions(updatedSince: Date?) -> AnyPublisher<SubscriptionsResponse, RocketChatError>
    func getHistory(rid: String, t: String, latest: Date) -> AnyPublisher<HistoryResponse, RocketChatError>
    func syncMessages(rid: String, updatedSince: Date) -> AnyPublisher<MessagesResponse, RocketChatError>
    func sendMessage(id: String, rid: String, msg: String) -> AnyPublisher<SendMessageResponse, RocketChatError>
    func sendRead(rid: String) -> AnyPublisher<ReadResponse, RocketChatError>
}

final class RocketChatClient {
    private let server: Server
  
    init(server: Server) {
      self.server = server
    }
    
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
        
        return URLSession.shared.dataTaskPublisher(for: urlRequest)
            .tryMap { (data, response) in
              guard let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode else {
                throw RocketChatError.unauthorized
              }
              
              return try data.decode(T.Response.self)
            }
            .mapError { error in
                if let error = error as? DecodingError {
                    return .decoding(error: error)
                }
                if let error = error as? RocketChatError {
                    return error
                }
                
                return .unknown(error: error)
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
