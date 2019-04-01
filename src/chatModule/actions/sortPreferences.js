import * as types from './actionsTypes';

export function setAllPreferences(preferences) {
	return {
		type: types.SORT_PREFERENCES.SET_ALL,
		preferences
	};
}

export function setPreference(preference) {
	return {
		type: types.SORT_PREFERENCES.SET,
		preference
	};
}
