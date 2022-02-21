import { ACTIVE_USERS } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';
import { UserStatus } from '../definitions/UserStatus';

export interface IActiveUser {
	status: UserStatus;
	statusText: string;
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
