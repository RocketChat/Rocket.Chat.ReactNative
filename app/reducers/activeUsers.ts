import { ActiveUser, ApplicationActions } from '../definitions';
import { SET_ACTIVE_USERS } from '../actions/actionsTypes';

export interface IActiveUsers {
	[key: string]: ActiveUser;
}

export const initialState: IActiveUsers = {};

export default function activeUsers(state = initialState, action: ApplicationActions): IActiveUsers {
	switch (action.type) {
		case SET_ACTIVE_USERS:
			return {
				...state,
				...action.activeUsers
			};
		default:
			return state;
	}
}
