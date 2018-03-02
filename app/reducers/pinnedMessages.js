import { PINNED_MESSAGES } from '../actions/actionsTypes';

const initialState = {
	messages: [],
	isOpen: false
};

export default function server(state = initialState, action) {
	switch (action.type) {
		case PINNED_MESSAGES.OPEN:
			return {
				...state,
				isOpen: true
			};
		case PINNED_MESSAGES.MESSAGES_RECEIVED:
			return {
				...state,
				messages: [...state.messages, ...action.messages]
			};
		case PINNED_MESSAGES.MESSAGE_UNPINNED:
			return {
				...state,
				messages: state.messages.filter(message => message._id !== action.messageId)
			};
		case PINNED_MESSAGES.CLOSE:
			return initialState;
		default:
			return state;
	}
}
