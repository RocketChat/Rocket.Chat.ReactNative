import CoreData

extension Room {
	var messagesRequest: NSFetchRequest<Message> {
		let request = Message.fetchRequest()
		
		request.predicate = NSPredicate(format: "room == %@", self)
		request.sortDescriptors = [NSSortDescriptor(keyPath: \Message.ts, ascending: true)]
		
		return request
	}
	
	var lastMessage: Message? {
		let request = Message.fetchRequest()
		
		let thisRoomPredicate = NSPredicate(format: "room == %@", self)
		let nonInfoMessagePredicate = NSPredicate(format: "t == nil", self)
		request.predicate = NSCompoundPredicate(
			andPredicateWithSubpredicates: [thisRoomPredicate, nonInfoMessagePredicate]
		)
		request.sortDescriptors = [NSSortDescriptor(keyPath: \Message.ts, ascending: false)]
		request.fetchLimit = 1
		
		return try? managedObjectContext?.fetch(request).first
	}
	
	var firstMessage: Message? {
		let request = Message.fetchRequest()
		
		request.predicate = NSPredicate(format: "room == %@", self)
		request.sortDescriptors = [NSSortDescriptor(keyPath: \Message.ts, ascending: true)]
		request.fetchLimit = 1
		
		return try? managedObjectContext?.fetch(request).first
	}
}
