import SwiftUI

struct ServerListView: View {
  @StateObject var viewModel: ServerListViewModel
    
  @FetchRequest(entity: Server.entity(), sortDescriptors: [], animation: .default)
  private var servers: FetchedResults<Server>
  
  init(dependencies: ServerListViewModel.Dependencies) {
    _viewModel = StateObject(wrappedValue: ServerListViewModel(dependencies: dependencies))
  }
  
  @ViewBuilder
  private func errorView(_ text: String) -> some View {
    VStack(alignment: .center) {
      Text(text)
      Button("Try Again") {
        viewModel.loadServers()
      }
    }
  }
  
  var body: some View {
    VStack {
      switch viewModel.state {
      case .loading:
        ProgressView()
      case .loaded where servers.count > 0:
        List {
          ForEach(servers) { server in
            ServerView(server: server)
              .onTapGesture {
                viewModel.didTap(server: server)
              }
          }
        }
      case .loaded:
        errorView("There are no servers connected.")
      case .error(let connectionError):
        switch connectionError {
        case .needsUnlock:
          errorView("You need to unlock your iPhone.")
        case .decoding:
          errorView("We can't read servers information.")
        }
      }
    }
    .navigationTitle("Servers")
    .padding()
    .onAppear {
      viewModel.loadServers()
    }
  }
}
