import { PERMISSIONS } from '../actions/actionsTypes';
import { TActionPermissions } from '../actions/permissions';
import { SUPPORTED_PERMISSIONS } from '../lib/methods/getPermissions';

export type TSupportedPermissions = typeof SUPPORTED_PERMISSIONS[number];

export type IPermissions = {
	[K in TSupportedPermissions]?: string[];
};

export const initialState: IPermissions = {};

export default function permissions(state = initialState, action: TActionPermissions): IPermissions {
	switch (action.type) {
		case PERMISSIONS.SET:
			return action.permissions;
		case PERMISSIONS.UPDATE:
			return {
				...state,
				[action.payload.id]: action.payload.roles
			};
		default:
			return state;
	}
}
