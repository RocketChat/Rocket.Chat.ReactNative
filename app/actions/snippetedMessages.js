import * as types from './actionsTypes';

export function openSnippetedMessages(rid) {
	return {
		type: types.SNIPPETED_MESSAGES.OPEN,
		rid
	};
}

export function closeSnippetedMessages() {
	return {
		type: types.SNIPPETED_MESSAGES.CLOSE
	};
}

export function snippetedMessagesReceived(messages) {
	return {
		type: types.SNIPPETED_MESSAGES.MESSAGES_RECEIVED,
		messages
	};
}
