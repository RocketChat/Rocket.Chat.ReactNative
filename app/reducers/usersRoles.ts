import { USERS_ROLES } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';

type TUserRole = {
	_id: string;
	roles: string[];
	username: string;
};

export type TUsersRoles = TUserRole[];

export const initialState: TUsersRoles = [];

export default (state = initialState, action: TApplicationActions): TUsersRoles => {
	switch (action.type) {
		case USERS_ROLES.SET:
			return action.usersRoles;
		default:
			return state;
	}
};
