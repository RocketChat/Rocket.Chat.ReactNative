import { checkAndReopen, connect, determineAuthType, disconnect } from './connect';
import { mediaSessionInstance } from './voip/MediaSessionInstance';
import { pendingHangups } from './voip/pendingHangups';

jest.mock('./voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { reset: jest.fn(), drainPendingHangups: jest.fn() }
}));

jest.mock('../methods/helpers/deviceInfo', () => ({
	...jest.requireActual('../methods/helpers/deviceInfo'),
	isIOS: false
}));

// --- SDK mock ---
// The new DDP SDK registers a single connection.on('connection', cb) listener.
// All event-driven tests invoke getCapturedConnectionListener() to drive it.
const mockConnectionOn = jest.fn();
const mockConnectionConnect = jest.fn().mockResolvedValue(undefined);
const mockConnectionCheckAndReopen = jest.fn().mockResolvedValue(true);
const mockSdkInitialize = jest.fn().mockResolvedValue(undefined);
const mockSdkOnCollection = jest.fn();
const mockSdkDisconnect = jest.fn();

jest.mock('./sdk', () => {
	const state: { server: string | undefined; currentEnabled: boolean } = { server: undefined, currentEnabled: true };
	return {
		__esModule: true,
		default: {
			get server() {
				return state.server;
			},
			disconnect: (...args: any[]) => mockSdkDisconnect(...args),
			initialize: (s: string) => mockSdkInitialize(s),
			onCollection: (...args: any[]) => mockSdkOnCollection(...args),
			get current() {
				if (!state.currentEnabled) return undefined;
				return {
					connection: {
						on: (event: string, cb: any) => mockConnectionOn(event, cb),
						connect: () => mockConnectionConnect(),
						checkAndReopen: () => mockConnectionCheckAndReopen()
					}
				};
			}
		},
		__setServer: (v: string | undefined) => {
			state.server = v;
		},
		__setCurrentEnabled: (v: boolean) => {
			state.currentEnabled = v;
		}
	};
});

const sdkMock = jest.requireMock('./sdk') as {
	__setServer: (v: string | undefined) => void;
	__setCurrentEnabled: (v: boolean) => void;
};

// --- Store mock ---
type MockStoreState = {
	meteor: { connected: boolean };
	login: { user: unknown; isAuthenticated: boolean };
	settings: Record<string, unknown>;
	server: { version: string };
};
const mockStoreGetState = jest.fn<MockStoreState, []>(() => ({
	meteor: { connected: false },
	login: { user: null, isAuthenticated: false },
	settings: {},
	server: { version: '6.0.0' }
}));
const mockStoreDispatch = jest.fn<unknown, [unknown]>();
const mockStoreSubscribe = jest.fn<() => void, [() => void]>(() => () => undefined);

jest.mock('../store/auxStore', () => ({
	store: {
		getState: () => mockStoreGetState(),
		dispatch: (action: unknown) => mockStoreDispatch(action),
		subscribe: (cb: () => void) => mockStoreSubscribe(cb)
	}
}));

jest.mock('../database', () => ({
	__esModule: true,
	default: { setActiveDB: jest.fn(), active: { get: jest.fn() } }
}));

jest.mock('../methods/subscribeRooms', () => ({ unsubscribeRooms: jest.fn() }));
jest.mock('../methods/getSettings', () => ({ getSettings: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../methods/helpers/events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), on: jest.fn(), removeListener: jest.fn() }
}));
jest.mock('../methods/helpers/protectedFunction', () => ({ __esModule: true, default: (fn: any) => fn }));
jest.mock('../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../methods/setUser', () => ({ _setUser: jest.fn(), _activeUsers: { activeUsers: {} }, _setUserTimer: {} }));
jest.mock('../methods/getRoles', () => ({ onRolesChanged: jest.fn() }));
jest.mock('../methods/getUsersPresence', () => ({ setPresenceCap: jest.fn() }));

jest.mock('../../actions/connect', () => ({
	connectRequest: jest.fn().mockReturnValue({ type: 'CONNECT_REQUEST' }),
	connectSuccess: jest.fn().mockReturnValue({ type: 'CONNECT_SUCCESS' }),
	disconnect: jest.fn().mockReturnValue({ type: 'DISCONNECT' })
}));
jest.mock('../../actions/login', () => ({
	loginRequest: jest.fn().mockReturnValue({ type: 'LOGIN_REQUEST' }),
	logout: jest.fn().mockReturnValue({ type: 'LOGOUT' }),
	setLoginServices: jest.fn().mockReturnValue({ type: 'SET_LOGIN_SERVICES' }),
	setUser: jest.fn().mockReturnValue({ type: 'SET_USER' })
}));
jest.mock('../../actions/settings', () => ({ updateSettings: jest.fn().mockReturnValue({ type: 'UPDATE_SETTINGS' }) }));
jest.mock('../../actions/permissions', () => ({ updatePermission: jest.fn().mockReturnValue({ type: 'UPDATE_PERMISSION' }) }));
jest.mock('../../actions/activeUsers', () => ({ setActiveUsers: jest.fn().mockReturnValue({ type: 'SET_ACTIVE_USERS' }) }));

// --- Helpers ---
const flushMicrotasks = async (): Promise<void> => {
	for (let i = 0; i < 5; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
};

/** Returns the status-handler callback registered via connection.on('connection', cb). */
const getCapturedConnectionListener = (): (status: string) => void => {
	const call = mockConnectionOn.mock.calls.find(([event]) => event === 'connection');
	if (!call) throw new Error('connection listener was never registered');
	return call[1];
};

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('determineAuthType', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('oauth_custom', () => {
		it('should return oauth_custom when custom is true and showButton is not false', () => {
			const services: IServices = {
				name: 'custom-service',
				custom: true,
				showButton: true,
				buttonLabelText: 'Custom Login',
				service: 'custom'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth_custom');
		});

		it('should return oauth_custom when custom is true and showButton is undefined (not false)', () => {
			const services: IServices = {
				name: 'custom-service',
				custom: true,
				showButton: undefined as any,
				buttonLabelText: 'Custom Login',
				service: 'custom'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth_custom');
		});

		it('should not return oauth_custom when custom is true but showButton is false', () => {
			const services: IServices = {
				name: 'custom-service',
				custom: true,
				showButton: false,
				buttonLabelText: 'Custom Login',
				service: 'saml'
			};

			const result = determineAuthType(services);
			expect(result).toBe('saml');
		});

		it('should not return oauth_custom when custom is false', () => {
			const services: IServices = {
				name: 'custom-service',
				custom: false,
				showButton: true,
				buttonLabelText: 'Custom Login',
				service: 'saml'
			};

			const result = determineAuthType(services);
			expect(result).toBe('saml');
		});
	});

	describe('saml', () => {
		it('should return saml when service is saml', () => {
			const services: IServices = {
				name: 'saml-service',
				custom: false,
				showButton: true,
				buttonLabelText: 'SAML Login',
				service: 'saml'
			};

			const result = determineAuthType(services);
			expect(result).toBe('saml');
		});
	});

	describe('cas', () => {
		it('should return cas when service is cas', () => {
			const services: IServices = {
				name: 'cas-service',
				custom: false,
				showButton: true,
				buttonLabelText: 'CAS Login',
				service: 'cas'
			};

			const result = determineAuthType(services);
			expect(result).toBe('cas');
		});
	});

	describe('apple', () => {
		it('should return not_supported when authName is apple but isIOS is false', () => {
			const services: IServices = {
				name: 'apple',
				custom: false,
				showButton: true,
				buttonLabelText: 'Apple Login',
				service: 'apple'
			};

			const result = determineAuthType(services);
			expect(result).toBe('not_supported');
		});

		it('should return not_supported when service is apple and name is empty but isIOS is false', () => {
			const services: IServices = {
				name: '',
				custom: false,
				showButton: true,
				buttonLabelText: 'Apple Login',
				service: 'apple'
			};

			const result = determineAuthType(services);
			expect(result).toBe('not_supported');
		});
	});

	describe('oauth', () => {
		const availableOAuth = ['facebook', 'github', 'gitlab', 'google', 'linkedin', 'meteor-developer', 'twitter', 'wordpress'];

		availableOAuth.forEach(oauthProvider => {
			it(`should return oauth for ${oauthProvider} service`, () => {
				const services: IServices = {
					name: oauthProvider,
					custom: false,
					showButton: true,
					buttonLabelText: `${oauthProvider} Login`,
					service: oauthProvider
				};

				const result = determineAuthType(services);
				expect(result).toBe('oauth');
			});

			it(`should return oauth for ${oauthProvider} name even when service is different`, () => {
				const services: IServices = {
					name: oauthProvider,
					custom: false,
					showButton: true,
					buttonLabelText: `${oauthProvider} Login`,
					service: 'some-other-service'
				};

				const result = determineAuthType(services);
				expect(result).toBe('oauth');
			});
		});

		it('should use service as authName when name is empty', () => {
			const services: IServices = {
				name: '',
				custom: false,
				showButton: true,
				buttonLabelText: 'GitHub Login',
				service: 'github'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth');
		});
	});

	describe('not_supported', () => {
		it('should return not_supported for unknown service', () => {
			const services: IServices = {
				name: 'unknown-service',
				custom: false,
				showButton: true,
				buttonLabelText: 'Unknown Login',
				service: 'unknown'
			};

			const result = determineAuthType(services);
			expect(result).toBe('not_supported');
		});

		it('should return not_supported for drupal (mentioned in TODO comment)', () => {
			const services: IServices = {
				name: 'drupal',
				custom: false,
				showButton: true,
				buttonLabelText: 'Drupal Login',
				service: 'drupal'
			};

			const result = determineAuthType(services);
			expect(result).toBe('not_supported');
		});

		it('should return not_supported for github_enterprise (mentioned in TODO comment)', () => {
			const services: IServices = {
				name: 'github_enterprise',
				custom: false,
				showButton: true,
				buttonLabelText: 'GitHub Enterprise Login',
				service: 'github_enterprise'
			};

			const result = determineAuthType(services);
			expect(result).toBe('not_supported');
		});
	});

	describe('authName fallback logic', () => {
		it('should use name as authName when both name and service are provided', () => {
			const services: IServices = {
				name: 'github',
				custom: false,
				showButton: true,
				buttonLabelText: 'GitHub Login',
				service: 'some-other-service'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth');
		});

		it('should use service as authName when name is empty', () => {
			const services: IServices = {
				name: '',
				custom: false,
				showButton: true,
				buttonLabelText: 'Facebook Login',
				service: 'facebook'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth');
		});

		it('should use service as authName when name is null', () => {
			const services: IServices = {
				name: null as any,
				custom: false,
				showButton: true,
				buttonLabelText: 'Google Login',
				service: 'google'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth');
		});
	});

	describe('priority order', () => {
		it('should prioritize oauth_custom over other types', () => {
			const services: IServices = {
				name: 'github',
				custom: true,
				showButton: true,
				buttonLabelText: 'Custom GitHub',
				service: 'github'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth_custom');
		});

		it('should prioritize saml over oauth', () => {
			const services: IServices = {
				name: 'github',
				custom: false,
				showButton: true,
				buttonLabelText: 'SAML GitHub',
				service: 'saml'
			};

			const result = determineAuthType(services);
			expect(result).toBe('saml');
		});

		it('should prioritize cas over oauth', () => {
			const services: IServices = {
				name: 'github',
				custom: false,
				showButton: true,
				buttonLabelText: 'CAS GitHub',
				service: 'cas'
			};

			const result = determineAuthType(services);
			expect(result).toBe('cas');
		});
	});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('VoIP media session lifecycle (disconnect)', () => {
	it('calls mediaSessionInstance.reset when disconnect runs', () => {
		disconnect();
		expect(mediaSessionInstance.reset).toHaveBeenCalledTimes(1);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('connect — connection status handler', () => {
	const SERVER = 'https://example.com';

	beforeEach(() => {
		jest.clearAllMocks();
		sdkMock.__setServer(undefined);
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: null, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});
	});

	it('returns early without initializing when server is already active', async () => {
		sdkMock.__setServer(SERVER);
		await connect({ server: SERVER });
		expect(mockSdkInitialize).not.toHaveBeenCalled();
	});

	it('dispatches connectSuccess and loginRequest(resume) on reconnect when user has a token', async () => {
		await connect({ server: SERVER });
		const listener = getCapturedConnectionListener();
		const connectSuccessMock = jest.requireMock('../../actions/connect').connectSuccess;
		const loginRequestMock = jest.requireMock('../../actions/login').loginRequest;

		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: { token: 'auth-token-123' }, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});

		listener('connected');

		expect(connectSuccessMock).toHaveBeenCalled();
		expect(loginRequestMock).toHaveBeenCalledWith({ resume: 'auth-token-123' }, false);
	});

	it('does not dispatch connectSuccess when socket was already marked connected', async () => {
		await connect({ server: SERVER });
		const listener = getCapturedConnectionListener();
		const connectSuccessMock = jest.requireMock('../../actions/connect').connectSuccess;

		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});

		listener('connected');

		expect(connectSuccessMock).not.toHaveBeenCalled();
	});

	it('does not dispatch loginRequest when user has no token', async () => {
		await connect({ server: SERVER });
		const listener = getCapturedConnectionListener();
		const loginRequestMock = jest.requireMock('../../actions/login').loginRequest;

		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: { token: null }, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});

		listener('connected');

		expect(loginRequestMock).not.toHaveBeenCalled();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('connect — pendingHangups drain on reconnect', () => {
	const SERVER = 'https://example.com';

	beforeEach(() => {
		jest.clearAllMocks();
		sdkMock.__setServer(undefined);
		pendingHangups.clear();
		// isAuthenticated + connected = true so awaitDdpLoggedIn resolves immediately
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: true },
			settings: {},
			server: { version: '6.0.0' }
		});
	});

	it('drains pendingHangups via mediaSessionInstance after close → connected', async () => {
		pendingHangups.record('call-a');
		await connect({ server: SERVER });
		const listener = getCapturedConnectionListener();

		listener('closed');
		listener('connected');
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).toHaveBeenCalledTimes(1);
	});

	it('does not drain when "connected" fires without a prior "close"', async () => {
		pendingHangups.record('call-a');
		await connect({ server: SERVER });
		const listener = getCapturedConnectionListener();

		listener('connected');
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).not.toHaveBeenCalled();
	});

	it('skips drainPendingHangups when pendingHangups is empty', async () => {
		await connect({ server: SERVER });
		const listener = getCapturedConnectionListener();

		listener('closed');
		listener('connected');
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).not.toHaveBeenCalled();
	});

	it('stops the previous pendingHangups connected listener when connect runs again', async () => {
		// Arm the drain on the first connection
		pendingHangups.record('call-a');
		await connect({ server: SERVER });
		const firstListener = getCapturedConnectionListener();
		firstListener('closed');

		// Reconnect to a new server — new closure resets pendingHangupsDrainArmed to false
		sdkMock.__setServer(undefined);
		mockConnectionOn.mockClear();
		await connect({ server: 'https://other.example.com' });
		const secondListener = getCapturedConnectionListener();

		// Firing 'connected' on the new connection should NOT drain (armed state was not carried over)
		secondListener('connected');
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).not.toHaveBeenCalled();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('checkAndReopen', () => {
	afterEach(() => {
		sdkMock.__setCurrentEnabled(true);
	});

	it('resolves false when sdk.current is undefined', async () => {
		sdkMock.__setCurrentEnabled(false);
		await expect(checkAndReopen()).resolves.toBe(false);
	});

	it('delegates to connection.checkAndReopen() and returns its result', async () => {
		mockConnectionCheckAndReopen.mockResolvedValueOnce(true);
		await expect(checkAndReopen()).resolves.toBe(true);
		expect(mockConnectionCheckAndReopen).toHaveBeenCalledTimes(1);
	});

	it('forwards false when connection.checkAndReopen() resolves false', async () => {
		mockConnectionCheckAndReopen.mockResolvedValueOnce(false);
		await expect(checkAndReopen()).resolves.toBe(false);
	});
});

// Note: Apple authentication when isIOS is true is tested in connect.ios.test.ts
