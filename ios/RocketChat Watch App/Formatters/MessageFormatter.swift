import Foundation

final class MessageFormatter {
	private let message: Message
	private let previousMessage: Message?
	
	init(message: Message, previousMessage: Message?) {
		self.message = message
		self.previousMessage = previousMessage
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
	
	func info() -> String? {
		switch message.t {
			case "rm":
				return "Message Removed"
			case "e2e":
				return "Encrypted message"
			default:
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
