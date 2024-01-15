import Foundation

struct WatchMessage: Codable {
  let servers: [Server]
  
  struct Server: Codable {
    let url: URL
    let name: String
    let iconURL: URL
    let useRealName: Bool
    let loggedUser: LoggedUser
    
    struct LoggedUser: Codable {
      let id: String
      let token: String
      let name: String
      let username: String
    }
  }
}
