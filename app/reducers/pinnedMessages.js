import { PINNED_MESSAGES } from '../actions/actionsTypes';

const initialState = {
	messages: []
};

export default function server(state = initialState, action) {
	switch (action.type) {
		case PINNED_MESSAGES.MESSAGE_RECEIVED:
			return {
				...state,
				messages: [...state.messages, action.message]
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
