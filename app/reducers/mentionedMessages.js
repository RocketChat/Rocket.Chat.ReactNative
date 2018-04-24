import { MENTIONED_MESSAGES } from '../actions/actionsTypes';

const initialState = {
	messages: [],
	ready: false
};

export default function server(state = initialState, action) {
	switch (action.type) {
		case MENTIONED_MESSAGES.OPEN:
			return {
				...state,
				ready: false
			};
		case MENTIONED_MESSAGES.READY:
			return {
				...state,
				ready: true
			};
		case MENTIONED_MESSAGES.MESSAGES_RECEIVED:
			return {
				...state,
				messages: [...state.messages, ...action.messages]
			};
		case MENTIONED_MESSAGES.CLOSE:
			return initialState;
		default:
			return state;
	}
}
