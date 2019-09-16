import { USERS_TYPING } from '../actions/actionsTypes';

const initialState = [];

export default function usersTyping(state = initialState, action) {
	switch (action.type) {
		case USERS_TYPING.ADD:
			if (state.findIndex(item => item === action.username) === -1) {
				return [...state, action.username];
			}
			return state;
		case USERS_TYPING.REMOVE:
			return state.filter(item => item !== action.username);
		case USERS_TYPING.CLEAR:
			return initialState;
		default:
			return state;
	}
}
