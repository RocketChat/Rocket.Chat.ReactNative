import Combine
import Foundation

protocol MessageSending {
	func sendMessage(_ msg: String, in room: Room)
}

final class MessageSender {
	private let client: RocketChatClientProtocol
	private let database: Database
	private let server: Server
	
	init(
		client: RocketChatClientProtocol,
		database: Database,
		server: Server
	) {
		self.client = client
		self.database = database
		self.server = server
	}
}

extension MessageSender: MessageSending {
	func sendMessage(_ msg: String, in room: Room) {
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

