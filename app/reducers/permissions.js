import { PERMISSIONS } from '../actions/actionsTypes';

const initialState = {
	permissions: {}
};

export default function permissions(state = initialState, action) {
	switch (action.type) {
		case PERMISSIONS.SET:
			return action.permissions;
		default:
			return state;
	}
}
