import { ROLES } from '../actions/actionsTypes';

const initialState = {};

export default function permissions(state = initialState, action) {
	switch (action.type) {
		case ROLES.SET:
			return action.roles;
		case ROLES.UPDATE:
			return {
				...state,
				[action.payload.id]: action.payload.desc || action.payload.id
			};
		case ROLES.REMOVE:
			const { [action.payload.id]: roleRemoved, ...newState } = state;
			return newState;
		default:
			return state;
	}
}
