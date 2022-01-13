import { encryptionSet, encryptionInit, encryptionSetBanner } from '../actions/encryption';
import { mockedStore } from './mockedStore';
import { initialState } from './encryption';

describe('test encryption reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().encryption;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after encryptionSet', () => {
		mockedStore.dispatch(encryptionSet(true, true));
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ banner: true, enabled: true });
	});

	it('should return empty store after encryptionInit', () => {
		mockedStore.dispatch(encryptionInit());
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ banner: null, enabled: false });
	});

	it('should return initial state after encryptionSetBanner', () => {
		mockedStore.dispatch(encryptionSetBanner(true));
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ banner: true, enabled: false });
	});
});
