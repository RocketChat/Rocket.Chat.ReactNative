import { Action } from 'redux';

import { IActiveUsers } from '../reducers/activeUsers';
import { SET_ACTIVE_USERS } from './actionsTypes';

export interface SetActiveUsers extends Action {
	activeUsers: IActiveUsers;
}

export type IActionActiveUsers = SetActiveUsers;

export const setActiveUsers = (activeUsers: IActiveUsers): SetActiveUsers => ({
	type: SET_ACTIVE_USERS,
	activeUsers
});
