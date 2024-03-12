import SwiftUI

final class MessageViewModel: ObservableObject {
	@Published private(set) var server: Server?
	@Published private(set) var message: Message
	@Published private(set) var previousMessage: Message?
	
	private let messageFormatter: MessageFormatter
	
	init(message: Message, previousMessage: Message? = nil, server: Server?, lastOpen: Date?) {
		self.message = message
		self.previousMessage = previousMessage
		self.messageFormatter = MessageFormatter(
			message: message,
			previousMessage: previousMessage,
			lastOpen: lastOpen
		)
		self.server = server
	}
	
	var sender: String? {
		server?.useRealName == true ? message.user?.name : message.user?.username
	}
	
	var date: String? {
		messageFormatter.date()
	}
	
	var time: String? {
		messageFormatter.time()
	}
	
	var info: LocalizedStringKey? {
		messageFormatter.info()
	}
	
	var hasDateSeparator: Bool {
		messageFormatter.hasDateSeparator()
	}
	
	var hasUnreadSeparator: Bool {
		messageFormatter.hasUnreadSeparator()
	}
	
	var isHeader: Bool {
		messageFormatter.isHeader() && !messageHaveAuthorName(message.t ?? "")
	}
	
}
