import * as types from './actionsTypes';

export function toggleCrashReport(value) {
	return {
		type: types.TOGGLE_CRASH_REPORT,
		payload: value
	};
}
