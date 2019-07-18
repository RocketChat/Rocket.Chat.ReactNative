import * as types from '../actions/actionsTypes';

const initialState = {
	inCall: false
};

export default function jitsi(state = initialState, action) {
	switch (action.type) {
		case types.JITSI.START_CALL:
			return {
				inCall: true
			};
		case types.JITSI.FINISH_CALL:
			return {
				inCall: false
			};
		default:
			return state;
	}
}
