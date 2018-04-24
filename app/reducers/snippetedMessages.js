import { SNIPPETED_MESSAGES } from '../actions/actionsTypes';

const initialState = {
	messages: [],
	ready: false
};

export default function server(state = initialState, action) {
	switch (action.type) {
		case SNIPPETED_MESSAGES.OPEN:
			return {
				...state,
				ready: false
			};
		case SNIPPETED_MESSAGES.READY:
			return {
				...state,
				ready: true
			};
		case SNIPPETED_MESSAGES.MESSAGES_RECEIVED:
			return {
				...state,
				messages: [...state.messages, ...action.messages]
			};
		case SNIPPETED_MESSAGES.CLOSE:
			return initialState;
		default:
			return state;
	}
}
