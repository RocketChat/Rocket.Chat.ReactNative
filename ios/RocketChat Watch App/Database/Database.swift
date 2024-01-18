import CoreData
import Foundation

protocol ServersDatabase {
	var viewContext: NSManagedObjectContext { get }
	
	func server(url: URL) -> Server?
	func user(id: String) -> LoggedUser?
	func servers() -> [Server]
	
	func save()
	
	func process(updatedServer: WatchMessage.Server)
}

final class DefaultDatabase: ServersDatabase {
	private let container: NSPersistentContainer
	
	var viewContext: NSManagedObjectContext {
		container.viewContext
	}
	
	private static let model: NSManagedObjectModel = {
		guard let url = Bundle.main.url(forResource: "Default", withExtension: "momd"),
			  let managedObjectModel = NSManagedObjectModel(contentsOf: url) else {
			fatalError("Can't find Core Data Model")
		}
		
		return managedObjectModel
	}()
	
	init() {
		container = NSPersistentContainer(name: "default", managedObjectModel: Self.model)
		
		container.loadPersistentStores { _, error in
			if let error { fatalError("Can't load persistent stores: \(error)") }
		}
		
		container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
	}
	
	func save() {
		guard container.viewContext.hasChanges else {
			return
		}
		
		try? container.viewContext.save()
	}
	
	func server(url: URL) -> Server? {
		let request = Server.fetchRequest()
		request.predicate = NSPredicate(format: "url == %@", url.absoluteString)
		
		return try? viewContext.fetch(request).first
	}
	
	func user(id: String) -> LoggedUser? {
		let request = LoggedUser.fetchRequest()
		request.predicate = NSPredicate(format: "id == %@", id)
		
		return try? viewContext.fetch(request).first
	}
	
	func servers() -> [Server] {
		let request = Server.fetchRequest()
		
		return (try? viewContext.fetch(request)) ?? []
	}
	
	func process(updatedServer: WatchMessage.Server) {
		if let server = server(url: updatedServer.url) {
			server.url = updatedServer.url
			server.name = updatedServer.name
			server.iconURL = updatedServer.iconURL
			server.useRealName = updatedServer.useRealName
			server.loggedUser = user(from: updatedServer.loggedUser)
		} else {
			Server(
				context: viewContext,
				iconURL: updatedServer.iconURL,
				name: updatedServer.name,
				url: updatedServer.url,
				useRealName: updatedServer.useRealName,
				loggedUser: user(from: updatedServer.loggedUser)
			)
		}
		
		save()
	}
	
	private func user(from updatedUser: WatchMessage.Server.LoggedUser) -> LoggedUser {
		if let user = user(id: updatedUser.id) {
			user.id = updatedUser.id
			user.name = updatedUser.name
			user.username = updatedUser.username
			user.token = updatedUser.token
			
			return user
		}
		
		return LoggedUser(
			context: viewContext,
			id: updatedUser.id,
			name: updatedUser.name,
			token: updatedUser.token,
			username: updatedUser.username
		)
	}
}
