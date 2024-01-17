import Foundation

final class RocketChatAppRouter: ObservableObject {
  @Storage("current_server") var currentServer: URL?
  
  @Published var route: Route = .serverList
  
  private let database: Database
  
  init(database: Database) {
    self.database = database
    loadRoute()
  }
  
  private func loadRoute() {
    if let currentServer, let server = database.server(url: currentServer) {
      route = .roomList(server)
    } else if database.servers().count == 1, let server = database.servers().first {
      route = .roomList(server)
    } else {
      route = .serverList
    }
  }
  
  func route(to route: Route) {
    DispatchQueue.main.async {
      self.route = route
    }
  }
}

extension RocketChatAppRouter {
  enum Route {
    case roomList(Server)
    case serverList
  }
}
