import { ROLES } from '../actions/actionsTypes';

const initialState = {
	roles: {}
};

export default function permissions(state = initialState, action) {
	switch (action.type) {
		case ROLES.SET:
			return action.roles;
		default:
			return state;
	}
}
