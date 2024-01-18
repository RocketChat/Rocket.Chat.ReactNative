import CoreData

@objc
public final class Server: NSManagedObject {
	
	@nonobjc public class func fetchRequest() -> NSFetchRequest<Server> {
		NSFetchRequest<Server>(entityName: "Server")
	}
	
	@NSManaged public var iconURL: URL
	@NSManaged public var name: String
	@NSManaged public var updatedSince: Date?
	@NSManaged public var url: URL
	@NSManaged public var useRealName: Bool
	@NSManaged public var loggedUser: LoggedUser
	
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
		iconURL: URL,
		name: String,
		updatedSince: Date? = nil,
		url: URL,
		useRealName: Bool,
		loggedUser: LoggedUser
	) {
		let entity = NSEntityDescription.entity(forEntityName: "Server", in: context)!
		super.init(entity: entity, insertInto: context)
		self.iconURL = iconURL
		self.name = name
		self.updatedSince = updatedSince
		self.url = url
		self.useRealName = useRealName
		self.loggedUser = loggedUser
	}
}

extension Server: Identifiable {
	
}

extension Server {
	var roomsRequest: NSFetchRequest<Room> {
		let request = Room.fetchRequest()
		
		request.predicate = NSPredicate(format: "archived == false")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \Room.ts, ascending: false)]
		
		return request
	}
}
