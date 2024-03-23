import SwiftUI

struct InfoMessage {
	let msg: String
	let username: String
	let type: String
	let role: String
	let comment: String
}

func getInfoMessage(_ infoMessage: InfoMessage) -> LocalizedStringKey {
	switch infoMessage.type {
		case "rm":
			return "message removed"
		case "uj":
			return "joined the channel"
		case "ujt":
			return "joined this team"
		case "ut":
			return "joined the conversation"
		case "r":
			return "changed room name to: \(infoMessage.msg)"
		case "ru":
			return "removed \(infoMessage.msg)"
		case "au":
			return "added \(infoMessage.msg)"
		case "user-muted":
			return "muted \(infoMessage.msg)"
		case "room_changed_description":
			return "changed room description to: \(infoMessage.msg)"
		case "room_changed_announcement":
			return "changed room announcement to: \(infoMessage.msg)"
		case "room_changed_topic":
			return "changed room topic to: \(infoMessage.msg)"
		case "room_changed_privacy":
			return "changed room to \(infoMessage.msg)"
		case "room_changed_avatar":
			return "changed room avatar"
		case "message_snippeted":
			return "created a snippet"
		case "room_e2e_disabled":
			return "disabled E2E encryption for this room"
		case "room_e2e_enabled":
			return "enabled E2E encryption for this room"
		case "removed-user-from-team":
			return "removed @\(infoMessage.msg) from this team"
		case "added-user-to-team":
			return "added @\(infoMessage.msg) to this team"
		case "user-added-room-to-team":
			return "added #\(infoMessage.msg) to this team"
		case "user-converted-to-team":
			return "converted #\(infoMessage.msg) to a team"
		case "user-converted-to-channel":
			return "converted #\(infoMessage.msg) to channel"
		case "user-deleted-room-from-team":
			return "deleted #\(infoMessage.msg)"
		case "user-removed-room-from-team":
			return "removed #\(infoMessage.msg) from this team"
		case "room-disallowed-reacting":
			return "disallowed reactions"
		case "room-allowed-reacting":
			return "allowed reactions"
		case "room-set-read-only":
			return "set room to read only"
		case "room-removed-read-only":
			return "removed read only permission"
		case "user-unmuted":
			return "unmuted \(infoMessage.msg)"
		case "room-archived":
			return "archived room"
		case "room-unarchived":
			return "unarchived room"
		case "subscription-role-added":
			return "defined \(infoMessage.msg) as \(infoMessage.role)"
		case "subscription-role-removed":
			return "removed \(infoMessage.msg) as \(infoMessage.role)"
		case "message_pinned":
			return "Pinned a message:"
		case "ul":
			return "left the channel"
		case "ult":
			return "has left the team"
		case "jitsi_call_started":
			return "Call started by \(infoMessage.username)"
		case "omnichannel_placed_chat_on_hold":
			return "Chat on hold: \(infoMessage.comment)"
		case "omnichannel_on_hold_chat_resumed":
			return "On hold chat resumed: \(infoMessage.comment)"
		case "command":
			return "returned the chat to the queue"
		case "livechat-started":
			return "Chat started"
		case "livechat-close":
			return "Conversation closed"
		case "livechat_transfer_history":
			return "New chat transfer: \(infoMessage.username) returned the chat to the queue"
		default:
			return "Unsupported system message"
	}
}

func messageHaveAuthorName(_ messageType: String) -> Bool {
	messagesWithAuthorName.contains(messageType)
}

extension InfoMessage {
	init(from message: Message) {
		self.init(
			msg: message.msg ?? "",
			username: message.user?.username ?? "",
			type: message.t ?? "",
			role: message.role ?? "",
			comment: message.comment ?? ""
		)
	}
}

private let messagesWithAuthorName: Set<String> = [
	"r",
	"ru",
	"au",
	"rm",
	"uj",
	"ujt",
	"ut",
	"ul",
	"ult",
	"message_pinned",
	"message_snippeted",
	"removed-user-from-team",
	"added-user-to-team",
	"user-added-room-to-team",
	"user-converted-to-team",
	"user-converted-to-channel",
	"user-deleted-room-from-team",
	"user-removed-room-from-team",
	"omnichannel_placed_chat_on_hold",
	"omnichannel_on_hold_chat_resumed",
	"livechat_navigation_history",
	"livechat_transcript_history",
	"command",
	"livechat-started",
	"livechat-close",
	"livechat_video_call",
	"livechat_webrtc_video_call",
	"livechat_transfer_history",
	"room-archived",
	"room-unarchived",
	"user-muted",
	"room_changed_description",
	"room_changed_announcement",
	"room_changed_topic",
	"room_changed_privacy",
	"room_changed_avatar",
	"room_e2e_disabled",
	"room_e2e_enabled",
	"room-allowed-reacting",
	"room-disallowed-reacting",
	"room-set-read-only",
	"room-removed-read-only",
	"user-unmuted",
	"room-unarchived",
	"subscription-role-added",
	"subscription-role-removed"
]
