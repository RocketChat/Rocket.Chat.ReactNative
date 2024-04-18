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
		let messageID = String.random(17)
		let loggedUser = server.loggedUser
		
		guard let rid = room.rid, let roomID = room.id else {
			return
		}
		
		let newMessage = MergedRoom.Message(
			_id: messageID,
			rid: rid,
			msg: msg,
			u: .init(
				_id: loggedUser.id,
				username: loggedUser.username,
				name: loggedUser.name
			),
			ts: Date(),
			attachments: nil,
			t: nil,
			groupable: true,
			editedAt: nil,
			role: nil,
			comment: nil
		)
		
		database.handleSendMessageRequest(newMessage, in: roomID)
		
		resendMessage(messageID: messageID, msg: msg, in: room)
	}
	
	func resendMessage(messageID: String, msg: String, in room: Room) {
		guard let rid = room.rid, let roomID = room.id else { return }
		
		client.sendMessage(id: messageID, rid: rid, msg: msg)
			.receive(on: DispatchQueue.main)
			.subscribe(Subscribers.Sink { [weak self] completion in
				if case .failure = completion {
					self?.database.handleSendMessageError(messageID)
				}
			} receiveValue: { [weak self] messageResponse in
				self?.database.handleSendMessageResponse(messageResponse, in: roomID)
			})
	}
}

