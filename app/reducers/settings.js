import { SETTINGS } from '../actions/actionsTypes';

const initialState = {};

export default (state = initialState, action) => {
	switch (action.type) {
		case SETTINGS.ADD:
			return {
				...state,
				...action.payload
			};
		case SETTINGS.CLEAR:
			return initialState;
		default:
			return state;
	}
};
