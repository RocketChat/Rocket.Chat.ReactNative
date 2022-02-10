import { TApplicationActions } from '../definitions';
import { SET_ACTIVE_USERS } from '../actions/actionsTypes';

export type TUserStatus = 'online' | 'offline' | 'busy' | 'away';
export interface IActiveUser {
	status: TUserStatus;
	statusText: string;
}

export interface IActiveUsers {
	[key: string]: IActiveUser;
}

export const initialState: IActiveUsers = {};

export default function activeUsers(state = initialState, action: TApplicationActions): IActiveUsers {
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
