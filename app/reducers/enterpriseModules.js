import { ENTERPRISE_MODULES } from '../actions/actionsTypes';

const initialState = [];

export default (state = initialState, action) => {
	switch (action.type) {
		case ENTERPRISE_MODULES.SET:
			return action.payload;
		case ENTERPRISE_MODULES.CLEAR:
			return initialState;
		default:
			return state;
	}
};
