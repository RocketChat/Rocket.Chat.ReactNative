import { PERMISSIONS } from '../actions/actionsTypes';
import { TActionPermissions } from '../actions/permissions';

export type IPermissions = Record<string, string>;

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
