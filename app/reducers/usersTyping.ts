import { USERS_TYPING } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';

export type IUsersTyping = string[];

export const initialState: IUsersTyping = [];

export default function usersTyping(state = initialState, action: TApplicationActions): IUsersTyping {
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
