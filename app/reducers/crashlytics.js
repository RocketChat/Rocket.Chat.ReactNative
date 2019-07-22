import { TOGGLE_CRASHLYTICS } from '../actions/actionsTypes';

const initialState = {
	useCrashlytics: false
};


export default (state = initialState, action) => {
	switch (action.type) {
		case TOGGLE_CRASHLYTICS:
			return {
				useCrashlytics: action.payload
			};
		default:
			return state;
	}
};
