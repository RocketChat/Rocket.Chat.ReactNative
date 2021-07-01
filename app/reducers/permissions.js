import { PERMISSIONS } from '../actions/actionsTypes';

const initialState = {};

export default function permissions(state = initialState, action) {
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
