import * as types from './actionsTypes';

export function startCall() {
	return {
		type: types.JITSI.START_CALL
	};
}

export function finishCall() {
	return {
		type: types.JITSI.FINISH_CALL
	};
}
