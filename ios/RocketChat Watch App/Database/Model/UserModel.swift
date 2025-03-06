import CoreData

final class UserModel {
	private let context: NSManagedObjectContext
	
	init(context: NSManagedObjectContext) {
		self.context = context
	}
	
	func upsert(_ newUser: MergedRoom.Message.User) -> User {
		let user = user(id: newUser._id, in: context)
		user.name = newUser.name
		user.username = newUser.username
		
		return user
	}
	
	func fetch(id: String) -> User {
		user(id: id, in: context)
	}
}

extension UserModel {
	private func user(id: String, in context: NSManagedObjectContext) -> User {
		let request = User.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		guard let user = try? context.fetch(request).first else {
			let user = User(context: context)
			user.id = id
			
			return user
		}
		
		return user
	}
}
