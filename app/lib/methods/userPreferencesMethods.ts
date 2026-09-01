import { type IPreferences } from '../../definitions';
import userPreferences from './userPreferences';

const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';

export function getSortPreferences() {
	return userPreferences.getMap<Partial<IPreferences>>(SORT_PREFS_KEY);
}

export function saveSortPreference(param: Partial<IPreferences>) {
	const prefs = getSortPreferences();
	return userPreferences.setMap(SORT_PREFS_KEY, { ...prefs, ...param });
}
