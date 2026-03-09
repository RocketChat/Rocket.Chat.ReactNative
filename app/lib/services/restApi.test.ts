import { getDeviceToken } from '../notifications';
import NativeVoipModule from '../native/NativeVoip';
import { store as reduxStore } from '../store/auxStore';
import sdk from './sdk';
import { registerPushToken } from './restApi';

jest.mock('../notifications', () => ({
	getDeviceToken: jest.fn()
}));

jest.mock('../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		getLastVoipToken: jest.fn()
	}
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../methods/helpers', () => ({
	compareServerVersion: jest.fn(),
	getBundleId: 'chat.rocket.reactnative',
	isIOS: true
}));

jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		post: jest.fn(),
		current: {
			client: { host: 'https://chat.example.com' },
			currentLogin: { authToken: 'auth-token' }
		}
	}
}));

describe('registerPushToken', () => {
	const mockedGetDeviceToken = getDeviceToken as jest.Mock;
	const mockedGetLastVoipToken = NativeVoipModule.getLastVoipToken as jest.Mock;
	const mockedGetState = reduxStore.getState as jest.Mock;
	const mockedPost = sdk.post as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();

		mockedGetState.mockReturnValue({ login: { isAuthenticated: true } });
		mockedGetDeviceToken.mockReturnValue('apn-token');
		mockedGetLastVoipToken.mockReturnValue('voip-token');
		mockedPost.mockResolvedValue({});
		sdk.current.client.host = 'https://chat.example.com';
		sdk.current.currentLogin = { authToken: 'auth-token' };
	});

	it('waits for both iOS tokens before registering', async () => {
		mockedGetLastVoipToken.mockReturnValue('');

		await registerPushToken();

		expect(mockedPost).not.toHaveBeenCalled();
	});

	it('skips duplicate successful iOS registrations', async () => {
		await registerPushToken();
		await registerPushToken();

		expect(mockedPost).toHaveBeenCalledTimes(1);
		expect(mockedPost).toHaveBeenCalledWith('push.token', {
			value: 'apn-token',
			type: 'apn',
			appName: 'chat.rocket.reactnative',
			voipToken: 'voip-token'
		});
	});

	it('retries the same payload after a failed request', async () => {
		mockedPost.mockRejectedValueOnce(new Error('network'));

		await registerPushToken();
		await registerPushToken();

		expect(mockedPost).toHaveBeenCalledTimes(2);
	});
});
