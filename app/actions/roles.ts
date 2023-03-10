import { Action } from 'redux';

import { IRoles } from '../reducers/roles';
import { ROLES } from './actionsTypes';

export interface ISetRoles extends Action {
	roles: IRoles;
}

export interface IUpdateRoles extends Action {
	payload: { id: string; desc: string };
}

export interface IRemoveRoles extends Action {
	payload: { id: string };
}

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
