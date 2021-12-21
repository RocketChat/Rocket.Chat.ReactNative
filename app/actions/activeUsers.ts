import { Action } from 'redux';

import { ActiveUsers } from '../reducers/activeUsers';
import { SET_ACTIVE_USERS } from './actionsTypes';

export interface SetActiveUsers extends Action {
	type: typeof SET_ACTIVE_USERS;
	activeUsers: ActiveUsers;
}

export const setActiveUsers = (activeUsers: ActiveUsers): SetActiveUsers => ({
	type: SET_ACTIVE_USERS,
	activeUsers
});
