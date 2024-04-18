import CoreData

final class MessageDatabase {
	private let context: NSManagedObjectContext
	
	init(context: NSManagedObjectContext) {
		self.context = context
	}
	
	func upsert(_ newMessage: MergedRoom.Message) -> Message {
		let attachmentDatabase = AttachmentDatabase(context: context)
		let userDatabase = UserDatabase(context: context)
		
		let user = userDatabase.upsert(newMessage.u)
		let message = message(id: newMessage._id, in: context)
		
		message.status = "received"
		message.id = newMessage._id
		message.msg = newMessage.msg
		message.ts = newMessage.ts
		message.t = newMessage.t
		message.groupable = newMessage.groupable ?? true
		message.editedAt = newMessage.editedAt
		message.role = newMessage.role
		message.comment = newMessage.comment
		message.user = user
		
		if let messageAttachments = newMessage.attachments {
			for newAttachment in messageAttachments {
				let attachment = attachmentDatabase.upsert(newAttachment)
				
				attachment?.message = message
			}
		}
		
		return message
	}
	
	func fetch(id: String) -> Message? {
		let request = Message.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		return try? context.fetch(request).first
	}
}

extension MessageDatabase {
	private func message(id: String, in context: NSManagedObjectContext) -> Message {
		let request = Message.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		guard let message = try? context.fetch(request).first else {
			let message = Message(context: context)
			message.id = id
			message.ts = Date()
			
			return message
		}
		
		return message
	}
}
