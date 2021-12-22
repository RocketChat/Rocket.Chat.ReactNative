import { ApplicationActions } from '../definitions';
import { SET_ACTIVE_USERS } from '../actions/actionsTypes';

type UserStatus = 'online' | 'offline';
export interface ActiveUser {
	status: UserStatus;
	statusText?: string;
}

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
