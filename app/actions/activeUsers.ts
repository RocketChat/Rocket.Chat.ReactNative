import { Action } from 'redux';

import { IActiveUsers } from '../reducers/activeUsers';
import { ACTIVE_USERS } from './actionsTypes';

interface ISetActiveUsers extends Action {
	activeUsers: IActiveUsers;
}

export type TActionActiveUsers = ISetActiveUsers;

export const setActiveUsers = (activeUsers: IActiveUsers): ISetActiveUsers => ({
	type: ACTIVE_USERS.SET,
	activeUsers
});

export const clearActiveUsers = (): Action => ({
	type: ACTIVE_USERS.CLEAR
});
