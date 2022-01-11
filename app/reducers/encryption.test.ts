import { encryptionSet, encryptionSetBanner } from '../actions/encryption';
import { initialState } from './encryption';
import { mockedStore } from './mockedStore';

describe('test reducer', () => {
	it('should return initial state', () => {
		const { encryption } = mockedStore.getState();
		expect(encryption).toEqual(initialState);
	});

	it('should return correct createDiscussion state after dispatch createDiscussionRequest action', () => {
		mockedStore.dispatch(encryptionSet(true, {}));
		const { encryption } = mockedStore.getState();
		expect(encryption).toEqual({ enabled: true, banner: {} });
	});

	it('should return correct createDiscussion state after dispatch createDiscussionSuccess action', () => {
		mockedStore.dispatch(encryptionSetBanner('test'));
		const {
			encryption: { banner }
		} = mockedStore.getState();
		expect(banner).toEqual('test');
	});
});
