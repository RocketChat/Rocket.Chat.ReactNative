import * as types from '../actions/actionsTypes';

const initialState = {
	usersTyping: [],
	layoutAnimation: new Date()
};

export default function room(state = initialState, action) {
	switch (action.type) {
		case types.ROOM.OPEN:
			return {
				...initialState,
				...action.room,
				lastOpen: new Date()
			};
		case types.ROOM.CLOSE:
			return {
				...initialState
			};
		case types.ROOM.SET_LAST_OPEN:
			return {
				...state,
				lastOpen: action.date
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
		case types.ROOM.LAYOUT_ANIMATION:
			return {
				...state,
				layoutAnimation: new Date()
			};
		default:
			return state;
	}
}
