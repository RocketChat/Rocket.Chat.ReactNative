import SwiftUI

struct RoomListView: View {
    @StateObject private var viewModel: RoomListViewModel
    
    @FetchRequest<Room> private var rooms: FetchedResults<Room>
  
    init(dependencies: RoomListViewModel.Dependencies) {
      _viewModel = StateObject(wrappedValue: RoomListViewModel(dependencies: dependencies))
      _rooms = FetchRequest(fetchRequest: dependencies.server.roomsRequest)
    }
    
    var body: some View {
        List {
            ForEach(rooms) { room in
                NavigationLink(value: room) {
                    RoomView(viewModel: viewModel.roomViewModel(for: room))
                }
            }
        }
        .onAppear {
            viewModel.loadRooms()
        }
        .navigationTitle("Rooms")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Room.self) { room in
            MessageListView(viewModel: viewModel.messageListViewModel(for: room))
              .environment(\.managedObjectContext, viewModel.viewContext)
        }
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button("Servers") {
                    viewModel.logout()
                }
            }
        }
    }
}
