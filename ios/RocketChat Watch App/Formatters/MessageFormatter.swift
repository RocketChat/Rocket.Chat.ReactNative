import SwiftUI

final class MessageFormatter {
	private let message: Message
	private let previousMessage: Message?
	private let lastOpen: Date?
	
	init(message: Message, previousMessage: Message?, lastOpen: Date?) {
		self.message = message
		self.previousMessage = previousMessage
		self.lastOpen = lastOpen
	}
	
	func hasDateSeparator() -> Bool {
		if let previousMessage,
		   let previousMessageTS = previousMessage.ts,
		   let messageTS = message.ts,
		   Calendar.current.isDate(previousMessageTS, inSameDayAs: messageTS) {
			return false
		}
		return true
	}
	
	func hasUnreadSeparator() -> Bool {
		guard let messageTS = message.ts, let lastOpen else {
			return false
		}
		
		if previousMessage == nil {
			return messageTS > lastOpen
		} else if let previousMessage, let previousMessageTS = previousMessage.ts {
			return messageTS >= lastOpen && previousMessageTS < lastOpen
		} else {
			return false
		}
	}
	
	func isHeader() -> Bool {
		if let previousMessage,
		   let previousMessageTS = previousMessage.ts,
		   let messageTS = message.ts,
		   Calendar.current.isDate(previousMessageTS, inSameDayAs: messageTS),
		   previousMessage.user?.username == message.user?.username,
		   !(previousMessage.groupable == false || message.groupable == false || message.room?.broadcast == true),
		   messageTS - previousMessageTS < 300,
		   message.t != "rm",
		   previousMessage.t != "rm" {
			return false
		}
		
		return true
	}
	
	func info() -> LocalizedStringKey? {
		switch message.t {
		case .some:
			return getInfoMessage(.init(from: message))
		case .none:
			return nil
		}
	}
	
	func date() -> String? {
		guard let ts = message.ts else { return nil }
		
		let dateFormatter = DateFormatter()
		
		dateFormatter.locale = Locale.current
		dateFormatter.timeZone = TimeZone.current
		dateFormatter.timeStyle = .none
		dateFormatter.dateStyle = .long
		
		return dateFormatter.string(from: ts)
	}
	
	func time() -> String? {
		guard let ts = message.ts else { return nil }
		
		let dateFormatter = DateFormatter()
		
		dateFormatter.locale = Locale.current
		dateFormatter.timeZone = TimeZone.current
		dateFormatter.timeStyle = .short
		dateFormatter.dateStyle = .none
		
		return dateFormatter.string(from: ts)
	}
}
