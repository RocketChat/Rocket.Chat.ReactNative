import { ROOM_FILES } from '../actions/actionsTypes';

const initialState = {
	messages: []
};

export default function server(state = initialState, action) {
	switch (action.type) {
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
