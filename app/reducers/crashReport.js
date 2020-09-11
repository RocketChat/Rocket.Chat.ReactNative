import { TOGGLE_CRASH_REPORT, TOGGLE_ANALYTICS_EVENTS } from '../actions/actionsTypes';

const initialState = {
	allowCrashReport: false,
	allowAnalyticsEvents: false
};


export default (state = initialState, action) => {
	switch (action.type) {
		case TOGGLE_CRASH_REPORT:
			return {
				...state,
				allowCrashReport: action.payload
			};

		case TOGGLE_ANALYTICS_EVENTS:
			return {
				...state,
				allowAnalyticsEvents: action.payload
			};
		default:
			return state;
	}
};
