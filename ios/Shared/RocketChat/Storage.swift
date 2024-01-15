import Foundation

struct Credentials {
  let userId: String
  let userToken: String
}

final class Storage {
  static let shared = Storage()

  private let mmkv = MMKV.build()

  func getCredentials(server: String) -> Credentials {
    let userId = mmkv.userId(for: server)
    let userToken = mmkv.userToken(for: userId)
    
    return .init(userId: userId, userToken: userToken)
  }

  func getPrivateKey(server: String) -> String {
    mmkv.privateKey(for: server)
  }
}
