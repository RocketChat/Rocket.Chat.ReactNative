import Combine
import Foundation

protocol RoomListViewModeling {
  func viewModel(for room: Room) -> RoomViewModel
  
  func loadRooms()
  func logout()
}

final class RoomListViewModel: ObservableObject {
  struct Dependencies {
    let client: RocketChatClientProtocol
    let database: RocketChatDatabase
    let router: RocketChatAppRouter
    let server: Server
  }
  
  private let dependencies: Dependencies
  
  private var loadCancellable: AnyCancellable?
  
  init(dependencies: Dependencies) {
    self.dependencies = dependencies
  }
  
  private func scheduledLoadRooms() {
      Timer.scheduledTimer(withTimeInterval: 5, repeats: false) { [weak self] _ in
          self?.loadRooms()
      }
  }
  
  private func handleError(_ error: RocketChatError) {
    switch error {
    case .decoding(let error):
      print(error)
    case .unknown(let error):
      print(error)
    case .unauthorized:
      logout() // TODO: Remove database and server entry
    }
  }
}

// MARK: - RoomListViewModeling

extension RoomListViewModel: RoomListViewModeling {
  func viewModel(for room: Room) -> RoomViewModel {
    RoomViewModel(room: room, server: dependencies.server)
  }
  
  func loadRooms() {
    let newUpdatedSince = Date()
    
    let updatedSince = dependencies.server.updatedSince
    
    let client = dependencies.client
    
    loadCancellable = Publishers.Zip(
        client.getRooms(updatedSince: updatedSince),
        client.getSubscriptions(updatedSince: updatedSince)
    )
    .receive(on: DispatchQueue.main)
    .sink { completion in
        if case .failure(let error) = completion {
            self.handleError(error)
        }
    } receiveValue: { (roomsResponse, subscriptionsResponse) in
        let rooms = roomsResponse.update
        let subscriptions = subscriptionsResponse.update
        
        for room in rooms {
            let subscription = subscriptions.find(withRoomID: room._id)
            
            self.dependencies.database.process(subscription: subscription, in: room)
        }
        
        for subscription in subscriptions {
            self.dependencies.database.process(subscription: subscription)
        }
        
        self.scheduledLoadRooms()
        self.dependencies.server.updatedSince = newUpdatedSince
    }
  }
  
  func logout() {
    dependencies.router.route(to: .serverList)
  }
}
