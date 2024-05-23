import CoreData

@objc
public final class LoggedUser: NSManagedObject {
	
	@nonobjc public class func fetchRequest() -> NSFetchRequest<LoggedUser> {
		NSFetchRequest<LoggedUser>(entityName: "LoggedUser")
	}
	
	@NSManaged public var id: String
	@NSManaged public var name: String
	@NSManaged public var token: String
	@NSManaged public var username: String
	
	@available(*, unavailable)
	init() {
		fatalError()
	}
	
	@available(*, unavailable)
	init(context: NSManagedObjectContext) {
		fatalError()
	}
	
	public override init(entity: NSEntityDescription, insertInto context: NSManagedObjectContext?) {
		super.init(entity: entity, insertInto: context)
	}
	
	@discardableResult
	public init(
		context: NSManagedObjectContext,
		id: String,
		name: String,
		token: String,
		username: String
	) {
		let entity = NSEntityDescription.entity(forEntityName: "LoggedUser", in: context)!
		super.init(entity: entity, insertInto: context)
		self.id = id
		self.name = name
		self.token = token
		self.username = username
	}
}

extension LoggedUser: Identifiable {
	
}
