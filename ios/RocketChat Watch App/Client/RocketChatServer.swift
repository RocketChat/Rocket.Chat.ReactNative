import Foundation

struct RocketChatServer {
    let url: URL
}

extension RocketChatServer {
    static var `default`: Self {
        .init(url: .server("https://open.rocket.chat"))
    }
}

fileprivate extension URL {
    static func server(_ string: String) -> URL {
        guard let url = URL(string: string) else {
            fatalError("Could not initialize an url from \(string).")
        }
        
        return url
    }
}
