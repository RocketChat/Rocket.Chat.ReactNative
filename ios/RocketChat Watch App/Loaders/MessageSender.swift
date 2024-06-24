import Combine
import Foundation

protocol MessageSending {
	func sendMessage(_ msg: String, in room: Room)
	func resendMessage(message: Message, in room: Room)
}

final class MessageSender {
	@Dependency private var client: RocketChatClientProtocol
	@Dependency private var database: Database
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
	}
	
	private func sendMessageCall(_ message: MergedRoom.Message, in roomID: String) {
		database.handleSendMessageRequest(message, in: roomID)
		
		client.sendMessage(id: message._id, rid: message.rid, msg: message.msg)
			.receive(on: DispatchQueue.main)
			.subscribe(Subscribers.Sink { [weak self] completion in
				if case .failure = completion {
					self?.database.handleSendMessageError(message._id)
				}
			} receiveValue: { [weak self] messageResponse in
				self?.database.handleSendMessageResponse(messageResponse, in: roomID)
			})
	}
}

extension MessageSender: MessageSending {
	func sendMessage(_ msg: String, in room: Room) {
		guard let rid = room.rid, let roomID = room.id else { return }
		
		let messageID = String.random(17)
		let loggedUser = server.loggedUser
		
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

		sendMessageCall(newMessage, in: roomID)
	}
	
	func resendMessage(message: Message, in room: Room) {
		guard let rid = room.rid, let roomID = room.id else { return }
		
		guard let id = message.id, let msg = message.msg, let user = message.user, let userID = user.id else { return }
		
		let newMessage = MergedRoom.Message(
			_id: id,
			rid: rid,
			msg: msg,
			u: MergedRoom.Message.User(
				_id: userID,
				username: user.username,
				name: user.name
			),
			ts: Date(),
			attachments: nil,
			t: nil,
			groupable: true,
			editedAt: nil,
			role: nil,
			comment: nil
		)
		
		sendMessageCall(newMessage, in: roomID)
	}
}

