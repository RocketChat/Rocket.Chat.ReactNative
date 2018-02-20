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

export function pinnedMessageReceived(message) {
	return {
		type: types.PINNED_MESSAGES.MESSAGE_RECEIVED,
		message
	};
}

export function pinnedMessageUnpinned(messageId) {
	return {
		type: types.PINNED_MESSAGES.MESSAGE_UNPINNED,
		messageId
	};
}
