import * as types from '../actions/actionsTypes';

const initialState = {
	jitsiBaseURL: ''
};

export default function jitsi(state = initialState, action) {
	switch (action.type) {
		case types.JITSI.SET_BASE_URL:
			return {
				jitsiBaseURL: action.baseUrl
			};
		default:
			return state;
	}
}
