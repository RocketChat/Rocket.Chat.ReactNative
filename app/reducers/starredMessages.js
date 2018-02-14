import { STARRED_MESSAGES } from '../actions/actionsTypes';

const initialState = {};

export default function server(state = initialState, action) {
	switch (action.type) {
		case STARRED_MESSAGES.MESSAGE_RECEIVED:
			return {
				...state,
				...action.message
			};
		case STARRED_MESSAGES.CLOSE:
			return initialState;
		default:
			return state;
	}
}
