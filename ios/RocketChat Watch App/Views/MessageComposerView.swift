import SwiftUI

struct MessageComposerView: View {
    @ObservedObject private var viewModel: MessageComposerViewModel
  
    init(viewModel: MessageComposerViewModel) {
      self.viewModel = viewModel
    }
    
    @State private var message = ""
    
    var body: some View {
        if viewModel.isReadOnly {
            HStack {
                Spacer()
                Text("This room is read only")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Spacer()
            }
        } else {
            TextField("Message", text: $message)
                .submitLabel(.send)
                .onSubmit(send)
        }
    }
    
    func send() {
        guard !message.isEmpty else {
            return
        }
        
        viewModel.sendMessage(message)
        message = ""
    }
}
