import { STARRED_MESSAGES } from '../actions/actionsTypes';

const initialState = {
	messages: [],
	isOpen: false
};

export default function server(state = initialState, action) {
	switch (action.type) {
		case STARRED_MESSAGES.OPEN:
			return {
				...state,
				isOpen: true
			};
		case STARRED_MESSAGES.MESSAGES_RECEIVED:
			return {
				...state,
				messages: [...state.messages, ...action.messages]
			};
		case STARRED_MESSAGES.MESSAGE_UNSTARRED:
			return {
				...state,
				messages: state.messages.filter(message => message._id !== action.messageId)
			};
		case STARRED_MESSAGES.CLOSE:
			return initialState;
		default:
			return state;
	}
}
