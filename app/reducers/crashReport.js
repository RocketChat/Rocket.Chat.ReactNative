import { TOGGLE_CRASH_REPORT } from '../actions/actionsTypes';

const initialState = {
	allowCrashReport: false
};


export default (state = initialState, action) => {
	switch (action.type) {
		case TOGGLE_CRASH_REPORT:
			return {
				allowCrashReport: action.payload
			};
		default:
			return state;
	}
};
