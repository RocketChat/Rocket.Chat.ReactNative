import * as types from '../actions/actionsTypes';

const initialState = {
	usersTyping: []
};

export default function room(state = initialState, action) {
	switch (action.type) {
		case types.ROOM.OPEN:
			return {
				...initialState,
				...action.room
			};
		case types.ROOM.CLOSE:
			return {
				...initialState
			};
		case types.ROOM.ADD_USER_TYPING:
			return {
				...state,
				usersTyping: [...state.usersTyping.filter(user => user !== action.username), action.username]
			};
		case types.ROOM.REMOVE_USER_TYPING:
			return {
				...state,
				usersTyping: [...state.usersTyping.filter(user => user !== action.username)]
			};
		default:
			return state;
	}
}
