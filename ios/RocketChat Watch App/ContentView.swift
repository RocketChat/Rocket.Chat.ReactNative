import SwiftUI

final class ContentViewModel: ObservableObject {
  private let connection: Connection
  
  init(connection: Connection) {
    self.connection = connection
  }
  
  func onAppear() {
    connection.sendMessage { result in
      print(result)
    }
  }
}

struct ContentView: View {
  @StateObject var viewModel = ContentViewModel(
    connection: WatchConnection()
  )
  
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
        .onAppear {
          viewModel.onAppear()
        }
    }
}

#Preview {
    ContentView()
}
