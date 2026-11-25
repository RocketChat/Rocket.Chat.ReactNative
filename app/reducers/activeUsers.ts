import { ACTIVE_USERS } from '../actions/actionsTypes';
import { type TApplicationActions } from '../definitions/redux';
import { type TStatusSource } from '../definitions/TStatusSource';
import { type TUserStatus } from '../definitions/TUserStatus';

export interface IActiveUser {
	status: TUserStatus;
	statusDefault?: TUserStatus;
	statusText: string;
	statusExpiresAt?: string;
	statusSource?: TStatusSource;
}

export interface IActiveUsers {
	[key: string]: IActiveUser;
}

export const initialState: IActiveUsers = {};

export default function activeUsers(state = initialState, action: TApplicationActions): IActiveUsers {
	switch (action.type) {
		case ACTIVE_USERS.SET:
			return {
				...state,
				...action.activeUsers
			};
		case ACTIVE_USERS.CLEAR:
			return initialState;
		default:
			return state;
	}
}
