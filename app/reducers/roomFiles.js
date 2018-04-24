import { ROOM_FILES } from '../actions/actionsTypes';

const initialState = {
	messages: [],
	ready: false
};

export default function server(state = initialState, action) {
	switch (action.type) {
		case ROOM_FILES.OPEN:
			return {
				...state,
				ready: false
			};
		case ROOM_FILES.READY:
			return {
				...state,
				ready: true
			};
		case ROOM_FILES.MESSAGES_RECEIVED:
			return {
				...state,
				messages: [...state.messages, ...action.messages]
			};
		case ROOM_FILES.CLOSE:
			return initialState;
		default:
			return state;
	}
}
