import { IPreferences } from '../../definitions';
import userPreferences from './userPreferences';

const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';

export function getSortPreferences() {
	return userPreferences.getMap(SORT_PREFS_KEY);
}

export function saveSortPreference(param: Partial<IPreferences>) {
	let prefs = getSortPreferences();
	prefs = { ...prefs, ...param } as object;
	return userPreferences.setMap(SORT_PREFS_KEY, prefs);
}
