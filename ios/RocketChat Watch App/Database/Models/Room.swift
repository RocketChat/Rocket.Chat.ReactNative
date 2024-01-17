import CoreData

extension Room {
    var lastMessage: Message? {
        let request = Message.fetchRequest()
        
        request.predicate = NSPredicate(format: "room == %@", self)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Message.ts, ascending: false)]
        request.fetchLimit = 1
        
        return try? managedObjectContext?.fetch(request).first
    }
}
