import SwiftUI

struct MessageListView: View {
	private let messageComposer = "MESSAGE_COMPOSER_ID"
	
	private let client: RocketChatClientProtocol
	private let database: Database
	private let messagesLoader: MessagesLoading
	private let messageSender: MessageSending
	private let formatter: RoomFormatter
	private let server: Server
	private let room: Room
	
	@State private var lastMessageID: String?
	@State private var lastOpen: Date?
	
	@FetchRequest<Message> private var messages: FetchedResults<Message>
	
	init(
		client: RocketChatClientProtocol,
		database: Database,
		messagesLoader: MessagesLoading,
		messageSender: MessageSending,
		room: Room,
		server: Server
	) {
		self.client = client
		self.database = database
		self.messagesLoader = messagesLoader
		self.messageSender = messageSender
		self.formatter = RoomFormatter(room: room, server: server)
		self.room = room
		self.server = server
		_messages = FetchRequest(fetchRequest: room.messagesRequest, animation: .none)
		_lastOpen = State(wrappedValue: room.updatedSince)
	}
	
	var body: some View {
		ScrollViewReader { reader in
			ScrollView {
				VStack(alignment: .leading, spacing: 8) {
					if room.hasMoreMessages {
						Button("Load More...") {
							guard let oldestMessage = room.firstMessage?.ts else { return }
							
							messagesLoader.loadMore(from: oldestMessage)
						}
					}
					
					ForEach(messages.indices, id: \.self) { index in
						let message = messages[index]
						let previousMessage = messages.indices.contains(index - 1) ? messages[index - 1] : nil
						
						MessageView(
							client: client,
							viewModel: .init(message: message, previousMessage: previousMessage, server: server, lastOpen: lastOpen)
						)
						.transition(.move(edge: .bottom))
					}
					
					MessageComposerView(room: room) {
						messageSender.sendMessage($0, in: room)
						
						lastOpen = nil
					}
					.id(messageComposer)
				}
			}
			.padding([.leading, .trailing])
			.navigationTitle(formatter.title ?? "")
			.navigationBarTitleDisplayMode(.inline)
			.onAppear {
				guard let roomID = room.id else { return }
				
				messagesLoader.start(on: roomID)
			}
			.onDisappear {
				messagesLoader.stop()
			}
			.onReceive(messages.publisher) { _ in
				if lastMessageID != messages.last?.id {
					reader.scrollTo(messageComposer, anchor: .bottom)
					lastMessageID = messages.last?.id
				}
			}
		}
	}
}
