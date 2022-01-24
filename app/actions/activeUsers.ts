import { Action } from 'redux';

import { IActiveUsers } from '../reducers/activeUsers';
import { SET_ACTIVE_USERS } from './actionsTypes';

export interface ISetActiveUsers extends Action {
	activeUsers: IActiveUsers;
}

export type TActionActiveUsers = ISetActiveUsers;

export const setActiveUsers = (activeUsers: IActiveUsers): ISetActiveUsers => ({
	type: SET_ACTIVE_USERS,
	activeUsers
});
