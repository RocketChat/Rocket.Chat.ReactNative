import * as types from './actionsTypes';

export function toggleCrashlytics(value) {
	return {
		type: types.TOGGLE_CRASHLYTICS,
		payload: value
	};
}
