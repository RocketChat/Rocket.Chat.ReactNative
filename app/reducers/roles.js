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
				[action.payload.id]: action.payload.desc || action.payload.id
			};
		case ROLES.ADD:
			return {
				...state,
				...{ [action.payload.id]: action.payload.desc }
			};
		case ROLES.REMOVE:
			delete state[action.payload.id];
			return state;

		default:
			return state;
	}
}
