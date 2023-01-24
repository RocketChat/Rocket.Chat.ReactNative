import { TApplicationActions } from '../definitions';
import { SELECTED_USERS } from '../actions/actionsTypes';

export interface ISelectedUser {
	_id: string;
	name: string;
	fname: string;
	search?: boolean;
	// username is used when is from searching
	username?: string;
}

export interface ISelectedUsers {
	users: ISelectedUser[];
	loading: boolean;
}

export const initialState: ISelectedUsers = {
	users: [],
	loading: false
};

export default function (state = initialState, action: TApplicationActions): ISelectedUsers {
	switch (action.type) {
		case SELECTED_USERS.ADD_USER:
			return {
				...state,
				users: state.users.concat(action.user)
			};
		case SELECTED_USERS.REMOVE_USER:
			return {
				...state,
				users: state.users.filter(item => item.name !== action.user.name)
			};
		case SELECTED_USERS.SET_LOADING:
			return {
				...state,
				loading: action.loading
			};
		case SELECTED_USERS.RESET:
			return initialState;
		default:
			return state;
	}
}
