import * as types from './actionsTypes';

export function openPinnedMessages(rid) {
	return {
		type: types.PINNED_MESSAGES.OPEN,
		rid
	};
}

export function closePinnedMessages() {
	return {
		type: types.PINNED_MESSAGES.CLOSE
	};
}

export function pinnedMessagesReceived(messages) {
	return {
		type: types.PINNED_MESSAGES.MESSAGES_RECEIVED,
		messages
	};
}

export function pinnedMessageUnpinned(messageId) {
	return {
		type: types.PINNED_MESSAGES.MESSAGE_UNPINNED,
		messageId
	};
}
