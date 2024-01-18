final class DependencyStore {
	func client(for server: Server) -> RocketChatClientProtocol {
		RocketChatClient(server: server)
	}
	
	let connection = WatchConnection(session: .default)
	
	let database = DefaultDatabase()
	
	private var activeDatabase: WeakRef<RocketChatDatabase>?
	
	func database(for server: Server) -> RocketChatDatabase {
		if let activeDatabase = activeDatabase?.value {
			return activeDatabase
		}
		
		let database = RocketChatDatabase(name: server.url.host ?? "server")
		activeDatabase = WeakRef(value: database)
		return database
	}
}

private final class WeakRef<T: AnyObject> {
	weak var value: T?
	
	init(value: T) {
		self.value = value
	}
}
