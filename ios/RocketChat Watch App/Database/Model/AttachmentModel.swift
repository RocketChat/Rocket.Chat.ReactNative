import CoreData

final class AttachmentModel {
	private let context: NSManagedObjectContext
	
	init(context: NSManagedObjectContext) {
		self.context = context
	}
	
	func upsert(_ newAttachment: MergedRoom.Message.Attachment) -> Attachment? {
		let identifier = newAttachment.imageURL ?? newAttachment.audioURL
		
		guard let identifier = identifier?.absoluteString ?? newAttachment.title else {
			return nil
		}
		
		let attachment = attachment(id: identifier, in: context)
		
		attachment.imageURL = newAttachment.imageURL
		attachment.msg = newAttachment.description
		attachment.width = newAttachment.dimensions?.width ?? 0
		attachment.height = newAttachment.dimensions?.height ?? 0
		
		return attachment
	}
}

extension AttachmentModel {
	private func attachment(id: String, in context: NSManagedObjectContext) -> Attachment {
		let request = Attachment.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		guard let attachment = try? context.fetch(request).first else {
			let attachment = Attachment(context: context)
			attachment.id = id
			
			return attachment
		}
		
		return attachment
	}
}
