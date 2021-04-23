import { ROLES } from '../actions/actionsTypes';

const initialState = {
	roles: {}
};

export default function permissions(state = initialState, action) {
	switch (action.type) {
		case ROLES.SET:
			return action.roles;
		case ROLES.UPDATE:
			return {
				...state,
				[action.payload.id]: action.payload.id || action.payload.desc
			};
		case ROLES.REMOVE:
			return state.filter(role => role.id !== action.payload.id);
		default:
			return state;
	}
}
