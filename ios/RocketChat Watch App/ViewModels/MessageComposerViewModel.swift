import Combine
import Foundation

final class MessageComposerViewModel: ObservableObject {
  var isReadOnly: Bool {
    room.isReadOnly
  }
  
  private let room: Room
  private let client: RocketChatClientProtocol
  private let database: RocketChatDatabase
  private let server: Server
  
  init(client: RocketChatClientProtocol, database: RocketChatDatabase, room: Room, server: Server) {
    self.client = client
    self.database = database
    self.room = room
    self.server = server
  }
  
  func sendMessage(_ msg: String) {
    guard let rid = room.id else { return }
    
    let messageID = database.createTempMessage(msg: msg, in: room, for: server.loggedUser)
    
    client.sendMessage(id: messageID, rid: rid, msg: msg)
        .receive(on: DispatchQueue.main)
        .subscribe(Subscribers.Sink { completion in
            if case .failure(let error) = completion {
                print(error)
            }
        } receiveValue: { [weak self] messageResponse in
            guard let self else {
              return
            }
          
            let message = messageResponse.message
            
            database.process(updatedMessage: message, in: room)
        })
  }
}
