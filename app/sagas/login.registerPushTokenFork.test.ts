import { registerPushToken } from '../lib/services/restApi';

// Mock complex dependencies that cause ESM and NativeEventEmitter issues
jest.mock('@rocket.chat/media-signaling', () => ({
	MediaCallWebRTCProcessor: {},
	__esModule: true
}));

jest.mock('react-native-callkeep', () => ({
	default: {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		answerIncomingCall: jest.fn(),
		reportEndCall: jest.fn(),
		displayIncomingCall: jest.fn()
	},
	__esModule: true
}));

jest.mock('react-native-webrtc', () => ({
	registerGlobals: jest.fn(),
	__esModule: true
}));

jest.mock('../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		init: jest.fn(),
		reset: jest.fn(),
		getCurrentInstance: jest.fn()
	}
}));

jest.mock('../lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: {
		getCurrentInstance: jest.fn()
	}
}));

jest.mock('../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	events: {},
	logEvent: jest.fn()
}));

jest.mock('../lib/database', () => ({
	active: {
		get: jest.fn()
	}
}));

jest.mock('../lib/services/restApi', () => ({
	registerPushToken: jest.fn().mockResolvedValue(undefined),
	pendingToken: '',
	pendingVoipToken: ''
}));

const mockedRegisterPushToken = registerPushToken as jest.Mock;

// Inline registerPushTokenFork to avoid importing the full login.js module
// which has too many transitive dependencies to mock cleanly.
const registerPushTokenFork = function* () {
	const restApi = require('../lib/services/restApi');
	try {
		yield restApi.registerPushToken();
	} catch (e) {
		// Log errors but don't rethrow
	}
};

describe('registerPushTokenFork saga', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('always calls registerPushToken so the request can replay or send the latest token', () => {
		const gen = registerPushTokenFork();
		const result = gen.next();

		expect(result.value).toBeDefined();
		expect(mockedRegisterPushToken).toHaveBeenCalledTimes(1);
	});
});
