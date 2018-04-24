import * as types from './actionsTypes';

export function openStarredMessages(rid, limit) {
	return {
		type: types.STARRED_MESSAGES.OPEN,
		rid,
		limit
	};
}

export function readyStarredMessages() {
	return {
		type: types.STARRED_MESSAGES.READY
	};
}

export function closeStarredMessages() {
	return {
		type: types.STARRED_MESSAGES.CLOSE
	};
}

export function starredMessagesReceived(messages) {
	return {
		type: types.STARRED_MESSAGES.MESSAGES_RECEIVED,
		messages
	};
}

export function starredMessageUnstarred(messageId) {
	return {
		type: types.STARRED_MESSAGES.MESSAGE_UNSTARRED,
		messageId
	};
}
