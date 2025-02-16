import type { Action } from 'redux';

import type { IRoles } from '../reducers/roles';
import { ROLES } from './actionsTypes';

export type ISetRoles = Action & { roles: IRoles; }

export type IUpdateRoles = Action & { payload: { id: string; desc: string }; }

export type IRemoveRoles = Action & { payload: { id: string }; }

export type IActionRoles = ISetRoles & IUpdateRoles & IRemoveRoles;

export function setRoles(roles: IRoles): ISetRoles {
	return {
		type: ROLES.SET,
		roles
	};
}

export function updateRoles(id: string, desc: string): IUpdateRoles {
	return {
		type: ROLES.UPDATE,
		payload: { id, desc }
	};
}

export function removeRoles(id: string): IRemoveRoles {
	return {
		type: ROLES.REMOVE,
		payload: { id }
	};
}
