import { encryptionSet, encryptionSetBanner, encryptionDecodeKey, encryptionDecodeKeyFailure } from '../actions/encryption';
import { createMockedStore } from './mockedStore';

describe('test encryption reducer', () => {
	it('should return initial state', () => {
		const store = createMockedStore();
		expect(store.getState().encryption).toEqual({ banner: '', enabled: false, failure: false });
	});

	it('should return modified store after encryptionSet', () => {
		const store = createMockedStore();
		store.dispatch(encryptionSet(true, 'BANNER'));
		expect(store.getState().encryption).toEqual({ banner: 'BANNER', enabled: true, failure: false });
	});

	it('should keep enabled and failure after encryptionSetBanner', () => {
		const store = createMockedStore();
		store.dispatch(encryptionDecodeKeyFailure());
		store.dispatch(encryptionSet(true, 'BANNER'));
		store.dispatch(encryptionSetBanner('BANNER_NEW'));
		expect(store.getState().encryption).toEqual({ banner: 'BANNER_NEW', enabled: true, failure: true });
	});

	it('should clear only failure after encryptionDecodeKey', () => {
		const store = createMockedStore();
		store.dispatch(encryptionDecodeKeyFailure());
		store.dispatch(encryptionSet(true, 'BANNER'));
		store.dispatch(encryptionDecodeKey('asd'));
		expect(store.getState().encryption).toEqual({ banner: 'BANNER', enabled: true, failure: false });
	});

	it('should disable encryption and set failure after encryptionDecodeKeyFailure', () => {
		const store = createMockedStore();
		store.dispatch(encryptionSet(true, 'BANNER'));
		store.dispatch(encryptionDecodeKeyFailure());
		expect(store.getState().encryption).toEqual({ banner: 'BANNER', enabled: false, failure: true });
	});
});
