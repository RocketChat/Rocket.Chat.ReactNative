import Combine
import Foundation

protocol MessageListViewModeling {
  func composerViewModel() -> MessageComposerViewModel
  func messageViewModel(for message: Message, and previousMessage: Message?) -> MessageViewModel
  
  func loadMessages(completionHandler: (() -> Void)?)
  func markAsRead()
  func stop()
}

final class MessageListViewModel: ObservableObject {
  @Published private var server: Server
  
  @Published private(set) var room: Room
  @Published private(set) var lastMessageID: String?
  
  private let client: RocketChatClientProtocol
  private let database: RocketChatDatabase
  private let formatter: RoomFormatter
  
  private var timer: Timer?
  
  private var syncCancellable: AnyCancellable?
  
  var title: String {
    formatter.title ?? ""
  }
  
  init(
    client: RocketChatClientProtocol,
    database: RocketChatDatabase,
    room: Room,
    server: Server
  ) {
    self.client = client
    self.database = database
    self.room = room
    self.server = server
    self.formatter = RoomFormatter(room: room, server: server)
  }
  
  deinit {
    print("MessageListViewModel.deinit \(room.fname ?? "")")
  }
  
  private func scheduledSync(in room: Room) -> Timer {
      Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
          self?.syncMessages(in: room)
      }
  }
  
  private func syncMessages(in room: Room) {
      guard let rid = room.id else { return }
      
      syncCancellable = client.syncMessages(rid: rid, updatedSince: room.updatedSince ?? Date())
          .receive(on: DispatchQueue.main)
          .sink { completion in
              if case .failure(let error) = completion {
                  print(error)
              }
          } receiveValue: { messagesResponse in
              let messages = messagesResponse.result.updated
              
              for message in messages {
                  self.database.process(updatedMessage: message, in: room)
              }
          }
  }
  
  private func loadMessages(in room: Room, latest: Date?) {
      guard let rid = room.id else { return }
    
      room.updatedSince = latest
      
      client.getHistory(rid: rid, t: room.t ?? "", latest: latest ?? Date())
          .receive(on: DispatchQueue.main)
          .subscribe(Subscribers.Sink { completion in
              if case .failure(let error) = completion {
                  print(error)
              }
          } receiveValue: { messagesResponse in
              let messages = messagesResponse.messages
              
              for message in messages {
                  self.database.process(updatedMessage: message, in: room)
              }
          })
  }
}

extension MessageListViewModel: MessageListViewModeling {
  func composerViewModel() -> MessageComposerViewModel {
    MessageComposerViewModel(client: client, database: database, room: room, server: server)
  }
  
  func messageViewModel(for message: Message, and previousMessage: Message?) -> MessageViewModel {
    MessageViewModel(message: message, previousMessage: previousMessage, server: server)
  }
  
  func loadMessages(completionHandler: (() -> Void)? = nil) {
    loadMessages(in: room, latest: room.lastMessage?.ts)
  }
  
  func markAsRead() {
    guard (room.unread > 0 || room.alert), let rid = room.id else {
      return
    }
    
    client.sendRead(rid: rid)
      .receive(on: DispatchQueue.main)
      .subscribe(Subscribers.Sink { completion in
        if case .failure(let error) = completion {
          print(error)
        }
      } receiveValue: { _ in
        self.database.markRead(in: rid)
      })
  }
  
  func stop() {
    syncCancellable?.cancel()
    timer?.invalidate()
  }
}
