import Combine
import Foundation

protocol MessageSending {
	func sendMessage(_ msg: String, in room: Room)
	func resendMessage(messageID: String, msg: String, in room: Room)
}

final class MessageSender {
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
	}
}

extension MessageSender: MessageSending {
	func sendMessage(_ msg: String, in room: Room) {
		let messageID = database.createTempMessage(msg: msg, in: room, for: server.loggedUser)
		
		resendMessage(messageID: messageID, msg: msg, in: room)
	}
	
	func resendMessage(messageID: String, msg: String, in room: Room) {
		guard let rid = room.rid else { return }
		
		client.sendMessage(id: messageID, rid: rid, msg: msg)
			.receive(on: DispatchQueue.main)
			.subscribe(Subscribers.Sink { [weak self] completion in
				guard let self else { return }
				
				if case .failure = completion {
					self.database.updateMessage(messageID, status: "error")
				}
			} receiveValue: { [weak self] messageResponse in
				guard let self else {
					return
				}
				
				let message = messageResponse.message
				
				self.database.process(updatedMessage: message, in: room)
				self.database.save()
			})
	}
}

