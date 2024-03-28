import { IPreferences } from '../definitions';
import { setAllPreferences, setPreference } from '../actions/sortPreferences';
import { mockedStore } from './mockedStore';
import { initialState } from './sortPreferences';
import { DisplayMode, SortBy } from '../lib/constants';

describe('test sortPreferences reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().sortPreferences;
		expect(state).toEqual(initialState);
	});

	it('should return correctly value after call setAllPreferences action', () => {
		const preferences: IPreferences = {
			displayMode: DisplayMode.Condensed,
			groupByType: true,
			showAvatar: true,
			showFavorites: true,
			showUnread: true,
			sortBy: SortBy.Activity
		};
		mockedStore.dispatch(setAllPreferences(preferences));
		const state = mockedStore.getState().sortPreferences;
		expect(state).toEqual(preferences);
	});

	it('should return correctly value after call setPreference action', () => {
		const preference: Partial<IPreferences> = {
			displayMode: DisplayMode.Expanded
		};
		mockedStore.dispatch(setPreference(preference));
		const { displayMode } = mockedStore.getState().sortPreferences;
		expect(displayMode).toEqual(DisplayMode.Expanded);
	});
});
