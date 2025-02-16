import type { Action } from 'redux';

import type { IPermissionsState, TSupportedPermissions } from '../reducers/permissions';
import { PERMISSIONS } from './actionsTypes';

type ISetPermissions = Action & { permissions: IPermissionsState; }

type IUpdatePermissions = Action & { payload: { id: TSupportedPermissions; roles: string[] }; }

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
