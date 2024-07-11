import {
	encryptionSet,
	encryptionInit,
	encryptionSetBanner,
	encryptionDecodeKey,
	encryptionDecodeKeyFailure
} from '../actions/encryption';
import { mockedStore } from './mockedStore';
import { initialState } from './encryption';

describe('test encryption reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().encryption;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after encryptionSet', () => {
		mockedStore.dispatch(encryptionSet(true, 'BANNER'));
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ banner: 'BANNER', enabled: true, failure: false });
	});

	it('should return empty store after encryptionInit', () => {
		mockedStore.dispatch(encryptionInit());
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ banner: '', enabled: false, failure: false });
	});

	it('should return initial state after encryptionSetBanner', () => {
		mockedStore.dispatch(encryptionSetBanner('BANNER_NEW'));
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ banner: 'BANNER_NEW', enabled: false, failure: false });
	});

	it('should return decode key state changes', () => {
		mockedStore.dispatch(encryptionInit());
		mockedStore.dispatch(encryptionDecodeKey('asd'));
		const state = mockedStore.getState().encryption;
		expect(state).toEqual({ ...initialState, failure: false });

		mockedStore.dispatch(encryptionDecodeKeyFailure());
		const stateF = mockedStore.getState().encryption;
		expect(stateF).toEqual({ ...initialState, failure: true });
	});
});
