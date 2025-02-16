import type { Action } from 'redux';

import type { IPreferences } from '../definitions';
import { SORT_PREFERENCES } from './actionsTypes';

type ISetAllPreferences = Action & { preferences: IPreferences; }

type ISetPreference = Action & { preference: Partial<IPreferences>; }

export type TActionSortPreferences = ISetAllPreferences & ISetPreference;

export function setAllPreferences(preferences: IPreferences): ISetAllPreferences {
	return {
		type: SORT_PREFERENCES.SET_ALL,
		preferences
	};
}

export function setPreference(preference: Partial<IPreferences>): ISetPreference {
	return {
		type: SORT_PREFERENCES.SET,
		preference
	};
}
