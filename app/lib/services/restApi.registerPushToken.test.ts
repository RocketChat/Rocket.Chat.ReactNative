import { store as reduxStore } from '../store/auxStore';
import sdk from './sdk';
import { pendingToken, pendingVoipToken, registerPushToken } from './restApi';
import NativeVoipModule from '../native/NativeVoip';
import { getDeviceToken } from '../notifications';

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(undefined),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

jest.mock('react-native-device-info', () => {
	const mockFn = jest.fn(() => 'test-value');
	return {
		__esModule: true,
		default: {
			getUniqueId: mockFn,
			getSystemVersion: mockFn,
			getVersion: mockFn,
			getBuildNumber: mockFn,
			hasNotch: mockFn,
			getReadableVersion: mockFn,
			getBundleId: mockFn,
			getModel: mockFn,
			isTablet: mockFn
		},
		getUniqueId: mockFn,
		getSystemVersion: mockFn,
		getVersion: mockFn,
		getBuildNumber: mockFn,
		hasNotch: mockFn,
		getReadableVersion: mockFn,
		getBundleId: mockFn,
		getModel: mockFn,
		isTablet: mockFn
	};
});

jest.mock('../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		getLastVoipToken: jest.fn(() => '')
	}
}));

jest.mock('../notifications', () => ({
	getDeviceToken: jest.fn(() => '')
}));

const baseState = {
	server: { version: '8.0.0', server: 'https://open.rocket.chat' },
	login: { user: { id: 'uid1', token: 'tok1' } }
};

beforeEach(() => {
	jest.clearAllMocks();
	(reduxStore.getState as jest.Mock).mockReturnValue(baseState);
	(sdk.post as jest.Mock).mockResolvedValue({ success: true });
	(getDeviceToken as jest.Mock).mockReturnValue('');
	NativeVoipModule.getLastVoipToken.mockReturnValue('');
});

describe('registerPushToken - pendingToken cache', () => {
	describe('when sdk.post rejects with 401', () => {
		it('sets pendingToken so it can be replayed after auth', async () => {
			(getDeviceToken as jest.Mock).mockReturnValue('auth-test-token');
			(sdk.post as jest.Mock).mockRejectedValue({ status: 401 });

			await registerPushToken();

			expect(pendingToken).toBe('auth-test-token');
			expect(pendingVoipToken).toBe('');
		});
	});

	describe('when sdk.post rejects with 403', () => {
		it('sets pendingToken so it can be replayed after auth', async () => {
			(getDeviceToken as jest.Mock).mockReturnValue('auth-test-token-403');
			(sdk.post as jest.Mock).mockRejectedValue({ status: 403 });

			await registerPushToken();

			expect(pendingToken).toBe('auth-test-token-403');
		});
	});

	describe('when sdk.post succeeds', () => {
		it('clears pendingToken', async () => {
			// First, simulate a failed registration to set pendingToken
			(getDeviceToken as jest.Mock).mockReturnValue('first-token');
			(sdk.post as jest.Mock).mockRejectedValue({ status: 401 });
			await registerPushToken();
			expect(pendingToken).toBe('first-token');

			// Now simulate a successful call — pendingToken should be cleared
			(sdk.post as jest.Mock).mockResolvedValue({ success: true });
			await registerPushToken();

			expect(pendingToken).toBe('');
			expect(pendingVoipToken).toBe('');
		});
	});

	describe('short-circuit guard with pendingToken', () => {
		it('does NOT short-circuit when pendingToken is set', async () => {
			(getDeviceToken as jest.Mock).mockReturnValue('my-token');

			// First call: 401 sets pendingToken
			(sdk.post as jest.Mock).mockRejectedValue({ status: 401 });
			await registerPushToken();
			expect(pendingToken).toBe('my-token');

			// Second call: same token, but pendingToken is set — should NOT short-circuit
			// because the short-circuit condition is:
			//   token === lastToken && voipToken === lastVoipToken && !pendingToken
			// Since !pendingToken is false (pendingToken is truthy), it proceeds
			(sdk.post as jest.Mock).mockResolvedValue({ success: true });
			await registerPushToken();
			expect(sdk.post).toHaveBeenCalledTimes(2); // 401 call + success call
		});
	});
});
