import SwiftUI

struct MessageListView: View {
    @StateObject private var viewModel: MessageListViewModel
    
    @FetchRequest<Message> private var messages: FetchedResults<Message>
    
    init(viewModel: MessageListViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
        _messages = FetchRequest(fetchRequest: viewModel.room.messagesRequest, animation: .none)
    }
    
    var body: some View {
        ScrollViewReader { reader in
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(messages.indices, id: \.self) { index in
                        let message = messages[index]
                        let previousMessage = messages.indices.contains(index - 1) ? messages[index - 1] : nil
                        
                        MessageView(viewModel: viewModel.messageViewModel(for: message, and: previousMessage))
                            .id(message.id)
                            .transition(.move(edge: .bottom))
                    }
                    
                    MessageComposerView(viewModel: viewModel.composerViewModel())
                        .padding(.top)
                }
            }
            .padding([.leading, .trailing])
            .navigationTitle(viewModel.title)
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                viewModel.loadMessages {
                  reader.scrollTo(messages.last?.id, anchor: .bottom)
                }
                
                viewModel.markAsRead()
            }
            .onDisappear {
                viewModel.stop()
            }
            .onReceive(messages.publisher) { _ in
                viewModel.markAsRead()
            }
        }
    }
}
