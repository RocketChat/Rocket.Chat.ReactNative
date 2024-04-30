import SwiftUI

struct MessageListView: View {
	private let messageComposer = "MESSAGE_COMPOSER_ID"
	
	@Dependency private var database: Database
	@Dependency private var messagesLoader: MessagesLoading
	@Dependency private var messageSender: MessageSending
	
	private let formatter: RoomFormatter
	private let server: Server
	
	@ObservedObject private var room: Room
	
	@State private var lastOpen: Date?
	@State private var info: Room?
	
	@Environment(\.scenePhase) private var scenePhase
	
	@FetchRequest<Message> private var messages: FetchedResults<Message>
	
	init(room: Room, server: Server) {
		self.formatter = RoomFormatter(room: room, server: server)
		self.room = room
		self.server = server
		_messages = FetchRequest(fetchRequest: room.messagesRequest, animation: .none)
		_lastOpen = State(wrappedValue: room.updatedSince)
	}
	
	var body: some View {
		Group {
			if messages.count == 0 {
				HStack(alignment: .bottom) {
					Spacer()
					VStack {
						Text("No messages")
							.font(.caption.italic())
							.foregroundStyle(Color.secondaryInfo)
							.frame(maxHeight: .infinity)
					}
					Spacer()
				}
			}
			ChatScrollView {
				VStack(spacing: 0) {
					if room.hasMoreMessages {
						Button("Load more...") {
							guard let oldestMessage = room.firstMessage?.ts else { return }
							
							messagesLoader.loadMore(from: oldestMessage)
						}
						.padding(.bottom, 8)
					}
					
					ForEach(messages.indices, id: \.self) { index in
						let message = messages[index]
						let previousMessage = messages.indices.contains(index - 1) ? messages[index - 1] : nil
						
						MessageView(
							viewModel: .init(
								message: message,
								previousMessage: previousMessage,
								server: server,
								lastOpen: lastOpen
							)
						) { action in
							switch action {
							case .resend(let message):
								messageSender.resendMessage(message: message, in: room)
								
								lastOpen = nil
							case .delete(let message):
								database.remove(message)
							}
						}
					}
					
					MessageComposerView(room: room) {
						messageSender.sendMessage($0, in: room)
						
						lastOpen = nil
					}
					.id(messageComposer)
					.padding(.top, 8)
				}
			}
		}
		.padding([.leading, .trailing])
		.navigationDestination(for: $info) { room in
			RoomInfoView(room: room)
				.environment(\.managedObjectContext, database.viewContext)
		}
		.navigationTitle {
			Text(formatter.title ?? "")
				.foregroundStyle(Color.titleLabels)
				.onTapGesture {
					if room.t == "d" {
						info = room
					}
				}
		}
		.navigationBarTitleDisplayMode(.inline)
		.disabled(!room.synced)
		.onAppear {
			guard let roomID = room.id else { return }
			
			messagesLoader.start(on: roomID)
		}
		.onDisappear {
			messagesLoader.stop()
		}
		.onChange(of: scenePhase) { phase in
			switch phase {
			case .active:
				guard let roomID = room.id else { return }
				
				messagesLoader.start(on: roomID)
			case .background, .inactive:
				messagesLoader.stop()
			@unknown default:
				break
			}
		}
	}
}
