import SwiftUI

struct RoomListView: View {
    @StateObject var viewModel: RoomListViewModel
    
    @FetchRequest(
        entity: Room.entity(),
        sortDescriptors: [
            NSSortDescriptor(keyPath: \Room.ts, ascending: false)
        ],
        predicate: NSPredicate(format: "archived == false"),
        animation: .default
    )
    private var rooms: FetchedResults<Room>
  
    init(dependencies: RoomListViewModel.Dependencies) {
      _viewModel = StateObject(wrappedValue: RoomListViewModel(dependencies: dependencies))
    }
    
    var body: some View {
        List {
            ForEach(rooms) { room in
              RoomView(viewModel: viewModel.viewModel(for: room))
            }
        }
        .onAppear {
            viewModel.loadRooms()
        }
        .navigationTitle("Rooms")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button("Servers") {
                    viewModel.logout()
                }
            }
        }
    }
}
