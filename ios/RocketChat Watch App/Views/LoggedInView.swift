import SwiftUI

struct LoggedInView: View {
	@Dependency private var database: Database
	@Dependency private var roomsLoader: RoomsLoader
	
	@EnvironmentObject private var router: AppRouter
	
	private let server: Server
	
	init(server: Server) {
		self.server = server
	}
	
	var body: some View {
		RoomListView(server: server, roomsLoader: roomsLoader)
			.environmentObject(router)
			.environment(\.managedObjectContext, database.viewContext)
	}
}
