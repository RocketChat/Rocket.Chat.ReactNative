import { SetActiveUsers } from '../actions/activeUsers';
import { SET_ACTIVE_USERS } from '../actions/actionsTypes';

type UserStatus = 'online' | 'offline';

interface ActiveUser {
	readonly status: UserStatus;
	readonly statusText?: string;
}

export interface ActiveUsers {
	[key: string]: ActiveUser;
}

const initialState: ActiveUsers = {};

export default function activeUsers(state = initialState, action: SetActiveUsers): ActiveUsers {
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
