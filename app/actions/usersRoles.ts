import { type Action } from 'redux';

import { type TUsersRoles } from '../reducers/usersRoles';
import { USERS_ROLES } from './actionsTypes';

export type TActionUsersRoles = Action & { usersRoles: TUsersRoles };

export function setUsersRoles(usersRoles: TUsersRoles): Action & { usersRoles: TUsersRoles } {
	return {
		type: USERS_ROLES.SET,
		usersRoles
	};
}
