import { Action } from 'redux';

import { IPermissionsState, TSupportedPermissions } from '../reducers/permissions';
import { PERMISSIONS } from './actionsTypes';

interface ISetPermissions extends Action {
	permissions: IPermissionsState;
}

interface IUpdatePermissions extends Action {
	payload: { id: TSupportedPermissions; roles: string[] };
}

export type TActionPermissions = ISetPermissions & IUpdatePermissions;

export function setPermissions(permissions: IPermissionsState): ISetPermissions {
	return {
		type: PERMISSIONS.SET,
		permissions
	};
}

export function updatePermission(id: TSupportedPermissions, roles: string[]): IUpdatePermissions {
	return {
		type: PERMISSIONS.UPDATE,
		payload: { id, roles }
	};
}
