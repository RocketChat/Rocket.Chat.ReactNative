import { Action } from 'redux';

import { IPermissions } from '../reducers/permissions';
import { PERMISSIONS } from './actionsTypes';

interface ISetPermissions extends Action {
	permissions: IPermissions;
}

interface IUpdatePermissions extends Action {
	payload: { id: string; roles: string };
}

export type TActionPermissions = ISetPermissions & IUpdatePermissions;

export function setPermissions(permissions: IPermissions): ISetPermissions {
	return {
		type: PERMISSIONS.SET,
		permissions
	};
}

export function updatePermission(id: string, roles: string): IUpdatePermissions {
	return {
		type: PERMISSIONS.UPDATE,
		payload: { id, roles }
	};
}
