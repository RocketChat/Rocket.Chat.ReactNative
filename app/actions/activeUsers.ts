import type { Action } from 'redux';

import type { IActiveUsers } from '../reducers/activeUsers';
import { ACTIVE_USERS } from './actionsTypes';

type ISetActiveUsers = Action & { activeUsers: IActiveUsers; }

export type TActionActiveUsers = ISetActiveUsers;

export const setActiveUsers = (activeUsers: IActiveUsers): ISetActiveUsers => ({
	type: ACTIVE_USERS.SET,
	activeUsers
});

export const clearActiveUsers = (): Action => ({
	type: ACTIVE_USERS.CLEAR
});
