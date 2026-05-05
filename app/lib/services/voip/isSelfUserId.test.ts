import { mockedStore } from '../../../reducers/mockedStore';
import { initStore } from '../../store/auxStore';
import { setUser } from '../../../actions/login';
import { isSelfUserId } from './isSelfUserId';

describe('isSelfUserId', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		mockedStore.dispatch(setUser({ id: 'me-id', username: 'me' }));
	});

	it('returns true when userId matches logged-in user id', () => {
		expect(isSelfUserId('me-id')).toBe(true);
	});

	it('returns false when userId differs from logged-in user id', () => {
		expect(isSelfUserId('other-id')).toBe(false);
	});

	it('returns false for empty userId', () => {
		expect(isSelfUserId('')).toBe(false);
	});

	it('returns false for null/undefined userId', () => {
		expect(isSelfUserId(null)).toBe(false);
		expect(isSelfUserId(undefined)).toBe(false);
	});

	it('returns false when logged-in user id is missing', () => {
		mockedStore.dispatch(setUser({ id: undefined, username: undefined }));
		expect(isSelfUserId('me-id')).toBe(false);
	});
});
