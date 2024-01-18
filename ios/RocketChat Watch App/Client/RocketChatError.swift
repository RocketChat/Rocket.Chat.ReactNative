import Foundation

enum RocketChatError: Error {
	case decoding(error: Error)
	case unknown(error: Error)
	case unauthorized
}
