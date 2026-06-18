import { getUidDirectMessage } from './helpers';
import { store as reduxStore } from '../../store/auxStore';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../../database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));

jest.mock('./log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const REDUX_USER_ID = 'reduxUserId';
const mockedGetState = reduxStore.getState as jest.Mock;

describe('getUidDirectMessage', () => {
	beforeEach(() => {
		mockedGetState.mockReturnValue({ login: { user: { id: REDUX_USER_ID } } });
	});

	afterEach(() => jest.clearAllMocks());

	describe('falsy or empty room', () => {
		it('returns null when room is null', () => {
			expect(getUidDirectMessage(null, 'me')).toBeNull();
		});

		it('returns null when room is undefined', () => {
			expect(getUidDirectMessage(undefined, 'me')).toBeNull();
		});

		it('returns undefined for an empty object room (no properties)', () => {
			expect(getUidDirectMessage({}, 'me')).toBeUndefined();
		});
	});

	describe('itsMe (self-DM)', () => {
		it('returns the logged user id for an itsMe room', () => {
			expect(getUidDirectMessage({ itsMe: true }, 'me')).toBe('me');
		});

		it('uses redux fallback when itsMe is true and loggedUserId is omitted', () => {
			expect(getUidDirectMessage({ itsMe: true })).toBe(REDUX_USER_ID);
			expect(mockedGetState).toHaveBeenCalled();
		});

		it('does not read redux when loggedUserId is passed explicitly', () => {
			expect(getUidDirectMessage({ itsMe: true }, 'explicit')).toBe('explicit');
			expect(mockedGetState).not.toHaveBeenCalled();
		});
	});

	describe('legacy rid-based resolution (no uids)', () => {
		describe('with explicit userId', () => {
			it('resolves the other user by stripping userId from rid', () => {
				expect(getUidDirectMessage({ rid: 'abcdef', t: 'd' }, 'abc')).toBe('def');
				expect(mockedGetState).not.toHaveBeenCalled();
			});

			it('strips userId from any position in rid', () => {
				expect(getUidDirectMessage({ rid: 'defabc', t: 'd' }, 'abc')).toBe('def');
			});

			it('returns empty string when rid equals userId (legacy self-DM)', () => {
				expect(getUidDirectMessage({ rid: 'abc', t: 'd' }, 'abc')).toBe('');
			});

			it('returns the full rid when userId is not found in it', () => {
				expect(getUidDirectMessage({ rid: 'abcdef', t: 'd' }, 'xyz')).toBe('abcdef');
			});
		});

		describe('with redux fallback (single room arg)', () => {
			it('resolves the other user using redux userId', () => {
				expect(
					getUidDirectMessage({ rid: 'reduxUserId' + 'otherUserId', t: 'd' })
				).toBe('otherUserId');
				expect(mockedGetState).toHaveBeenCalled();
			});

			it('does not enter legacy path when t is not "d"', () => {
				expect(getUidDirectMessage({ rid: 'abcdef', t: 'c' })).toBeUndefined();
				expect(mockedGetState).toHaveBeenCalled();
			});

			it('returns empty string when rid equals redux userId', () => {
				expect(getUidDirectMessage({ rid: 'reduxUserId', t: 'd' })).toBe('');
				expect(mockedGetState).toHaveBeenCalled();
			});
		});
	});

	describe('uids-based resolution', () => {
		describe('with explicit userId', () => {
			it('returns the other participant uid in a direct message', () => {
				expect(getUidDirectMessage({ uids: ['me', 'other'] }, 'me')).toBe('other');
				expect(mockedGetState).not.toHaveBeenCalled();
			});

			it('returns own uid for a self-DM (only own uid present)', () => {
				expect(getUidDirectMessage({ uids: ['me'] }, 'me')).toBe('me');
			});

			it('returns undefined for an empty uids array', () => {
				expect(getUidDirectMessage({ uids: [] }, 'me')).toBeUndefined();
			});

			it('returns the only other uid when there are exactly 2 uids and loggedUserId is the second', () => {
				expect(getUidDirectMessage({ uids: ['other', 'me'] }, 'me')).toBe('other');
			});

			it('returns the other uid when loggedUserId is not found in uids', () => {
				expect(getUidDirectMessage({ uids: ['a', 'b'] }, 'me')).toBe('a');
			});
		});

		describe('with redux fallback (single room arg)', () => {
			it('returns the other participant uid using redux userId', () => {
				expect(
					getUidDirectMessage({ uids: ['reduxUserId', 'otherUserId'] })
				).toBe('otherUserId');
				expect(mockedGetState).toHaveBeenCalled();
			});

			it('returns own uid for a self-DM', () => {
				expect(getUidDirectMessage({ uids: ['reduxUserId'] })).toBe('reduxUserId');
				expect(mockedGetState).toHaveBeenCalled();
			});

			it('returns the first uid when redux userId is not in uids', () => {
				expect(getUidDirectMessage({ uids: ['a', 'b'] })).toBe('a');
				expect(mockedGetState).toHaveBeenCalled();
			});
		});
	});

	describe('group chat', () => {
		describe('with explicit userId', () => {
			it('returns null for a group chat (more than two uids)', () => {
				expect(getUidDirectMessage({ uids: ['me', 'a', 'b'] }, 'me')).toBeNull();
				expect(mockedGetState).not.toHaveBeenCalled();
			});

			it('returns null when usernames indicate a group (more than two)', () => {
				expect(
					getUidDirectMessage({ usernames: ['me', 'a', 'b'], uids: ['me', 'a', 'b'] }, 'me')
				).toBeNull();
			});
		});

		describe('with redux fallback (single room arg)', () => {
			it('returns null using redux userId', () => {
				expect(getUidDirectMessage({ uids: ['reduxUserId', 'a', 'b'] })).toBeNull();
				expect(mockedGetState).toHaveBeenCalled();
			});
		});
	});
});
