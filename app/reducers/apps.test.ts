import { setAppsLanguages } from '../actions/apps';
import { type IAppsLanguages } from '../definitions';
import { initialState } from './apps';
import { mockedStore } from './mockedStore';

describe('test apps reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().apps;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after setAppsLanguages', () => {
		const languages: IAppsLanguages = { 'app-1': { en: { greeting: 'Hello' } } };
		mockedStore.dispatch(setAppsLanguages(languages));
		const state = mockedStore.getState().apps;
		expect(state.languages).toEqual(languages);
	});
});
