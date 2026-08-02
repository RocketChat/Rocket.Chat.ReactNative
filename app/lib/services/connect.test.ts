import { checkAndReopen, connect, determineAuthType, disconnect, login, loginTOTP } from './connect';
import { mediaSessionInstance } from './voip/MediaSessionInstance';
import { pendingHangups } from './voip/pendingHangups';
import { unsubscribeRooms } from '../methods/subscribeRooms';
import { setUser } from '../../actions/login';
import database from '../database';
import { onRolesChanged } from '../methods/getRoles';
import { STATUSES } from '../../definitions';

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
const mockConnectionProbe = jest.fn().mockResolvedValue(true);
const mockConnectionReopenNow = jest.fn().mockResolvedValue(undefined);
const mockSdkInitialize = jest.fn().mockResolvedValue(undefined);
const mockSdkOnCollection = jest.fn();
const mockSdkDisconnect = jest.fn();

const mockSdkLogin = jest.fn();
const mockAccountUser: { value: any } = { value: undefined };

jest.mock('./sdk', () => {
	const state: {
		server: string | undefined;
		currentEnabled: boolean;
		connection: { on: any; connect: any; probe: any; reopenNow: any; status: string } | undefined;
		status: string;
	} = {
		server: undefined,
		currentEnabled: true,
		connection: undefined,
		status: 'idle'
	};
	const makeConnection = () => ({
		on: (event: string, cb: any) => mockConnectionOn(event, cb),
		connect: () => mockConnectionConnect(),
		probe: () => mockConnectionProbe(),
		reopenNow: () => mockConnectionReopenNow(),
		get status() {
			return state.status;
		}
	});
	return {
		__esModule: true,
		default: {
			get server() {
				return state.server;
			},
			disconnect: (...args: any[]) => {
				state.connection = undefined;
				state.status = 'idle';
				return mockSdkDisconnect(...args);
			},
			// Mirrors the real sdk.ts: initialize() yields a brand-new connection instance each
			// call, so handlers attached by a previous connect() are discarded with the old instance.
			initialize: (s: string) => {
				state.server = s;
				state.connection = makeConnection();
				state.status = 'connecting';
				return mockSdkInitialize(s);
			},
			onCollection: (...args: any[]) => mockSdkOnCollection(...args),
			login: (...args: any[]) => mockSdkLogin(...args),
			get current() {
				if (!state.currentEnabled || !state.connection) return undefined;
				return {
					account: { user: mockAccountUser.value },
					connection: state.connection
				};
			}
		},
		__setServer: (v: string | undefined) => {
			state.server = v;
		},
		__setCurrentEnabled: (v: boolean) => {
			state.currentEnabled = v;
		},
		__setConnectionStatus: (v: string) => {
			state.status = v;
		},
		__getCurrentConnection: () => state.connection
	};
});

const mockCreateAndConnect = jest.fn();
jest.mock('@rocket.chat/ddp-client', () => ({
	DDPSDK: { createAndConnect: (...args: unknown[]) => mockCreateAndConnect(...args) }
}));

const mockTwoFactor = jest.fn();
jest.mock('./twoFactor', () => ({
	twoFactor: (...args: any[]) => mockTwoFactor(...args)
}));

jest.mock('../../ee/omnichannel/actions/inquiry', () => ({
	inquiryRequest: jest.fn().mockReturnValue({ type: 'INQUIRY_REQUEST' })
}));

const sdkMock = jest.requireMock('./sdk') as {
	__setServer: (v: string | undefined) => void;
	__setCurrentEnabled: (v: boolean) => void;
	__setConnectionStatus: (v: string) => void;
	__getCurrentConnection: () => { on: any; connect: any; probe: any; reopenNow: any; status: string } | undefined;
};

// --- Store mock ---
type MockStoreState = {
	meteor: { connected: boolean };
	login: { user: unknown; isAuthenticated: boolean };
	settings: Record<string, unknown>;
	server?: { version: string };
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

const mockHasRole = jest.fn();
jest.mock('../methods/helpers', () => ({
	...jest.requireActual('../methods/helpers'),
	hasRole: (...args: any[]) => mockHasRole(...args)
}));

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
const getCapturedConnectionListener = (): ((status: string) => void) => {
	const call = mockConnectionOn.mock.calls.find(([event]) => event === 'connection');
	if (!call) throw new Error('connection listener was never registered');
	return call[1];
};

/** Returns the collection handlers registered via sdk.onCollection(event, cb) for a given event. */
const getHandlersByEvent = (event: string): Array<(ddpMessage: any) => void> =>
	mockSdkOnCollection.mock.calls.filter(([collection]) => collection === event).map(([, cb]) => cb);

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
		sdkMock.__setConnectionStatus('idle');
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: null, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});
	});

	it('returns early without initializing when server is already active', async () => {
		await connect({ server: SERVER });
		mockSdkInitialize.mockClear();
		await connect({ server: SERVER });
		expect(mockSdkInitialize).not.toHaveBeenCalled();
	});

	it('re-initializes when sdk.server matches but the SDK never finished initializing (e.g. a prior failed connect())', async () => {
		// sdk.server is set synchronously inside initialize(), before loadBasicAuth()/handleTwoFactorChallenge()
		// run — a throw there leaves sdk.server pointing at this server with no live connection behind it.
		sdkMock.__setServer(SERVER);
		await connect({ server: SERVER });
		expect(mockSdkInitialize).toHaveBeenCalledWith(SERVER);
	});

	it('bails out if a newer connect() call switched servers while getSettings() was in flight', async () => {
		const getSettingsMock = jest.requireMock('../methods/getSettings').getSettings as jest.Mock;
		let resolveSettingsA: () => void;
		getSettingsMock.mockImplementationOnce(
			() =>
				new Promise<void>(resolve => {
					resolveSettingsA = resolve;
				})
		);

		sdkMock.__setServer(undefined);
		const connectAPromise = connect({ server: 'https://a.example.com' });
		await Promise.resolve(); // let connect(A) reach the getSettings() await

		// Simulate connect(B) having already taken over.
		sdkMock.__setServer('https://b.example.com');

		resolveSettingsA!();
		await connectAPromise;

		// connect(A)'s continuation must not have registered a connection listener for the stale call.
		expect(mockConnectionOn).not.toHaveBeenCalled();
	});

	it('aborts the previous connect() in-flight getSettings when a newer call supersedes it', async () => {
		const getSettingsMock = jest.requireMock('../methods/getSettings').getSettings as jest.Mock;
		let resolveSettingsA: () => void;
		let capturedSignal: AbortSignal | undefined;
		getSettingsMock.mockImplementationOnce((signal?: AbortSignal) => {
			capturedSignal = signal;
			return new Promise<void>(resolve => {
				resolveSettingsA = resolve;
			});
		});

		sdkMock.__setServer(undefined);
		const connectAPromise = connect({ server: 'https://a.example.com' });
		await Promise.resolve(); // let connect(A) reach the getSettings() await

		// connect(B) supersedes connect(A) while getSettings(A) is still in flight.
		// sdk.server is still 'a.example.com' here (set by connect(A)'s own initialize()) —
		// connect(B) is what flips it to 'b.example.com' via its own initialize() call below.
		await connect({ server: 'https://b.example.com' });

		// The previous call's REST request must have been signalled to abort so it
		// can't write server A's data into the now-active database B.
		expect(capturedSignal?.aborted).toBe(true);

		resolveSettingsA!();
		await connectAPromise;
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

	it('waits for login to become ready before draining', async () => {
		const subscribeCallbacks: Array<() => void> = [];
		mockStoreSubscribe.mockImplementation(cb => {
			subscribeCallbacks.push(cb);
			return () => {
				const index = subscribeCallbacks.indexOf(cb);
				if (index !== -1) {
					subscribeCallbacks.splice(index, 1);
				}
			};
		});
		pendingHangups.record('call-a');
		let state: MockStoreState = {
			meteor: { connected: false },
			login: { user: null, isAuthenticated: false },
			settings: {}
		};
		mockStoreGetState.mockImplementation(() => state);

		await connect({ server: 'https://example.com' });

		const listener = getCapturedConnectionListener();
		listener('closed');
		listener('connected');
		await flushMicrotasks();

		// Not ready yet — subscribed but not drained.
		expect(mediaSessionInstance.drainPendingHangups).not.toHaveBeenCalled();

		// Transition to authenticated + connected and notify subscribers.
		state = {
			meteor: { connected: true },
			login: { user: null, isAuthenticated: true },
			settings: {}
		};
		subscribeCallbacks.forEach(cb => cb());
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

describe('connect — collection listeners register independently of connection.connect() outcome', () => {
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

	it('registers collection listeners even when connection.connect() rejects', async () => {
		mockConnectionConnect.mockRejectedValueOnce(new Error('socket error'));

		await expect(connect({ server: SERVER })).rejects.toThrow('socket error');

		expect(mockSdkOnCollection).toHaveBeenCalledWith('stream-force_logout', expect.any(Function));
	});

	it('registers collection listeners before a hung connection.connect() ever settles', async () => {
		mockConnectionConnect.mockReturnValueOnce(new Promise(() => {}));

		// Intentionally not awaited: connection.connect() never resolves/rejects.
		connect({ server: SERVER });
		await flushMicrotasks();

		expect(mockSdkOnCollection).toHaveBeenCalledWith('stream-force_logout', expect.any(Function));
	});
});

describe('connect — listener lifecycle across reconnects', () => {
	it('attaches handlers to a fresh connection instance each connect, so old handlers are dropped (no leak)', async () => {
		sdkMock.__setServer(undefined);
		await connect({ server: 'https://a.example.com' });
		const connectionA = sdkMock.__getCurrentConnection();

		sdkMock.__setServer(undefined);
		await connect({ server: 'https://b.example.com' });
		const connectionB = sdkMock.__getCurrentConnection();

		// Each connect() renders its connection.on('connection', …) on its own instance.
		// Because the new SDK creates a fresh connection per connect() and disconnect() drops
		// the previous one, connectionA (and the handlers attached to it) is unreachable after
		// the second connect — exactly why the old `*.then(stopListener)` teardown is unnecessary.
		expect(connectionA).toBeDefined();
		expect(connectionB).toBeDefined();
		expect(connectionA).not.toBe(connectionB);
		expect(sdkMock.__getCurrentConnection()).toBe(connectionB);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('checkAndReopen', () => {
	afterEach(() => {
		sdkMock.__setCurrentEnabled(true);
		jest.clearAllMocks();
	});

	it('resolves false when sdk.current is undefined', async () => {
		sdkMock.__setCurrentEnabled(false);
		await expect(checkAndReopen()).resolves.toBe(false);
	});

	it('reopens when the connection status is not connected', async () => {
		sdkMock.__setConnectionStatus('disconnected');
		await expect(checkAndReopen()).resolves.toBe(true);
		expect(mockConnectionReopenNow).toHaveBeenCalledTimes(1);
		expect(mockConnectionProbe).not.toHaveBeenCalled();
	});

	it('probes when connected and skips the reopen when the socket is alive', async () => {
		sdkMock.__setConnectionStatus('connected');
		mockConnectionProbe.mockResolvedValueOnce(true);
		await expect(checkAndReopen()).resolves.toBe(true);
		expect(mockConnectionProbe).toHaveBeenCalledTimes(1);
		expect(mockConnectionReopenNow).not.toHaveBeenCalled();
	});

	it('reopens when the probe reports the socket dead', async () => {
		sdkMock.__setConnectionStatus('connected');
		mockConnectionProbe.mockResolvedValueOnce(false);
		await expect(checkAndReopen()).resolves.toBe(true);
		expect(mockConnectionProbe).toHaveBeenCalledTimes(1);
		expect(mockConnectionReopenNow).toHaveBeenCalledTimes(1);
	});
});

describe('connect — rooms subscription guard reset on close', () => {
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

	// Regression: a long background marks the DDP socket stale, so foregrounding triggers
	// `checkAndReopen` → `reopenNow`, which closes the stale socket and reconnects. The rooms-list `stream-notify-user` feed only re-subscribes when the
	// module-level guard in `subscribeRooms` is clear, and `unsubscribeRooms()` is what clears it.
	// If the 'close' handler stops calling `unsubscribeRooms()`, the guard stays set after reconnect
	// and the rooms list silently stops updating (subscriptions/favorites/reads).
	it('calls unsubscribeRooms when the socket "close" fires', async () => {
		await connect({ server: 'https://example.com' });

		// connect() itself calls unsubscribeRooms() once while tearing down prior listeners; ignore it.
		(unsubscribeRooms as jest.Mock).mockClear();

		const listener = getCapturedConnectionListener();
		listener('closed');

		expect(unsubscribeRooms).toHaveBeenCalledTimes(1);
	});
});

describe('connect — stream-notify-logged updateAvatar', () => {
	const mockUserUpdate = jest.fn<Promise<void>, [(u: { avatarETag: string }) => void]>(fn => {
		fn({ avatarETag: '' });
		return Promise.resolve();
	});
	const mockUserRecord = { update: (fn: (u: { avatarETag: string }) => void) => mockUserUpdate(fn) };
	const mockFetch = jest.fn<Promise<unknown[]>, []>(() => Promise.resolve([mockUserRecord]));
	const mockDbWrite = jest.fn<Promise<void>, [() => Promise<void>]>(async fn => {
		await fn();
	});

	beforeEach(async () => {
		jest.clearAllMocks();
		sdkMock.__setServer(undefined);
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: null, isAuthenticated: false },
			settings: {}
		});

		// Wire up database.active so the WatermelonDB section of the handler runs.
		(database.active as any).get = jest.fn(() => ({
			query: () => ({ fetch: () => mockFetch() })
		}));
		(database.active as any).write = (fn: () => Promise<void>) => mockDbWrite(fn);

		await connect({ server: 'https://example.com' });
	});

	const getUpdateAvatarHandler = () => getHandlersByEvent('stream-notify-logged')[0];

	const fireUpdateAvatar = async (args: { username: string; etag: string }) => {
		const handler = getUpdateAvatarHandler();
		handler({ fields: { eventName: 'updateAvatar', args: [args] } });
		await flushMicrotasks();
	};

	it('dispatches setUser with the new etag when the avatar belongs to the logged user', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: { id: 'u1', username: 'rocket.cat' }, isAuthenticated: true },
			settings: {}
		});

		await fireUpdateAvatar({ username: 'rocket.cat', etag: 'newEtag' });

		expect(mockStoreDispatch).toHaveBeenCalledWith(setUser({ avatarETag: 'newEtag' }));
	});

	it('does not dispatch setUser when the avatar belongs to another user', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: { id: 'u1', username: 'rocket.cat' }, isAuthenticated: true },
			settings: {}
		});

		await fireUpdateAvatar({ username: 'someone.else', etag: 'newEtag' });

		expect(mockStoreDispatch).not.toHaveBeenCalledWith(setUser({ avatarETag: 'newEtag' }));
	});

	it('does not dispatch setUser when there is no logged user', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: false },
			settings: {}
		});

		await fireUpdateAvatar({ username: 'rocket.cat', etag: 'newEtag' });

		expect(mockStoreDispatch).not.toHaveBeenCalledWith(setUser({ avatarETag: 'newEtag' }));
	});

	it('still updates the users-DB record with the new etag for the logged user', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: { id: 'u1', username: 'rocket.cat' }, isAuthenticated: true },
			settings: {}
		});

		await fireUpdateAvatar({ username: 'rocket.cat', etag: 'newEtag' });

		const updated = { avatarETag: '' };
		await mockUserUpdate.mock.calls[0][0](updated);
		expect(updated.avatarETag).toBe('newEtag');
	});
});

// Note: Apple authentication when isIOS is true is tested in connect.ios.test.ts

// ─────────────────────────────────────────────────────────────────────────────
describe('login', () => {
	beforeEach(() => {
		mockSdkLogin.mockReset();
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});
		mockAccountUser.value = undefined;
	});

	it('throws when sdk.login result has no me', async () => {
		mockSdkLogin.mockResolvedValue({});
		await expect(login({ user: 'u', password: 'p' } as any)).rejects.toThrow("Couldn't fetch user data");
	});

	it('throws when sdk.current.account.user is missing', async () => {
		mockSdkLogin.mockResolvedValue({ me: { username: 'john' } });
		mockAccountUser.value = undefined;
		await expect(login({ user: 'u', password: 'p' } as any)).rejects.toThrow('Login failed: no user returned');
	});

	it('returns an ILoggedUser combining account.user + me', async () => {
		mockAccountUser.value = { id: 'u-1', token: 'tok-1' };
		mockSdkLogin.mockResolvedValue({
			me: { username: 'john', name: 'John D', language: 'en', emails: [{ address: 'j@x.com' }] }
		});
		const result = await login({ user: 'john', password: 'p' } as any);
		expect(result).toEqual(
			expect.objectContaining({
				id: 'u-1',
				token: 'tok-1',
				username: 'john',
				name: 'John D',
				language: 'en'
			})
		);
	});

	it('reads showMessageInMainThread / enableMessageParserEarlyAdoption from me on RC < 5.0', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: false },
			settings: {},
			server: { version: '4.9.0' }
		});
		mockAccountUser.value = { id: 'u-1', token: 'tok-1' };
		mockSdkLogin.mockResolvedValue({
			me: {
				username: 'john',
				settings: { preferences: { enableMessageParserEarlyAdoption: false, showMessageInMainThread: true } }
			}
		});
		const result = await login({ user: 'john', password: 'p' } as any);
		expect(result?.enableMessageParserEarlyAdoption).toBe(false);
		expect(result?.showMessageInMainThread).toBe(true);
	});
});

describe('loginTOTP', () => {
	beforeEach(() => {
		mockSdkLogin.mockReset();
		mockTwoFactor.mockReset();
		mockStoreDispatch.mockReset();
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});
		mockAccountUser.value = { id: 'u-1', token: 'tok-1' };
	});

	it('returns the login result when no 2FA challenge is raised', async () => {
		mockSdkLogin.mockResolvedValue({ me: { username: 'john' } });
		const result = await loginTOTP({ user: 'john', password: 'p' } as any);
		expect(result.username).toBe('john');
	});

	it('prompts twoFactor with details.method and retries when totp-required', async () => {
		mockSdkLogin
			.mockRejectedValueOnce({ data: { error: 'totp-required', details: { method: 'totp' } } })
			.mockResolvedValueOnce({ me: { username: 'john' } });
		mockTwoFactor.mockResolvedValue({ twoFactorCode: '123456', twoFactorMethod: 'totp' });

		const result = await loginTOTP({ user: 'john', password: 'p' } as any, true);
		expect(mockTwoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false });
		expect(result.username).toBe('john');
	});

	it('passes invalid:true when retrying after totp-invalid', async () => {
		mockSdkLogin
			.mockRejectedValueOnce({
				data: { error: 'totp-invalid', details: { method: 'totp', error: 'totp-invalid' } }
			})
			.mockResolvedValueOnce({ me: { username: 'john' } });
		mockTwoFactor.mockResolvedValue({ twoFactorCode: '999999', twoFactorMethod: 'totp' });
		await loginTOTP({ user: 'john', password: 'p' } as any, true);
		expect(mockTwoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: true });
	});

	it('passes invalid:true when e.data.error is totp-invalid even if details.error is absent', async () => {
		mockSdkLogin
			.mockRejectedValueOnce({
				// details.error is intentionally absent — only e.data.error is set
				data: { error: 'totp-invalid', details: { method: 'totp' } }
			})
			.mockResolvedValueOnce({ me: { username: 'john' } });
		mockTwoFactor.mockResolvedValue({ twoFactorCode: '777777', twoFactorMethod: 'totp' });
		await loginTOTP({ user: 'john', password: 'p' } as any, true);
		expect(mockTwoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: true });
	});

	it('normalizes ldapPass to password on RC >= 3.9.0 before 2FA retry', async () => {
		mockSdkLogin
			.mockRejectedValueOnce({ data: { error: 'totp-required', details: { method: 'totp' } } })
			.mockResolvedValueOnce({ me: { username: 'john' } });
		mockTwoFactor.mockResolvedValue({ twoFactorCode: '111111', twoFactorMethod: 'totp' });
		await loginTOTP({ username: 'john', ldapPass: 'secret-ldap' } as any, true);
		const retryArgs = mockSdkLogin.mock.calls[1][0];
		expect(retryArgs).toMatchObject({ user: 'john', password: 'secret-ldap', code: '111111' });
		expect(retryArgs).not.toHaveProperty('ldapPass');
	});

	it('wraps the retry params in a totp envelope when loginEmailPassword is falsy', async () => {
		mockSdkLogin
			.mockRejectedValueOnce({ data: { error: 'totp-required', details: { method: 'totp' } } })
			.mockResolvedValueOnce({ me: { username: 'service' } });
		mockTwoFactor.mockResolvedValue({ twoFactorCode: '222222', twoFactorMethod: 'totp' });
		await loginTOTP({ user: 'service', password: 'p' } as any);
		const retryArgs = mockSdkLogin.mock.calls[1][0];
		expect(retryArgs).toMatchObject({ totp: { login: expect.any(Object), code: '222222' } });
	});

	it('rejects when twoFactor is cancelled', async () => {
		mockSdkLogin.mockRejectedValue({ data: { error: 'totp-required', details: { method: 'totp' } } });
		mockTwoFactor.mockRejectedValue(new Error('cancelled'));
		await expect(loginTOTP({ user: 'john', password: 'p' } as any, true)).rejects.toBeUndefined();
	});

	it('rejects non-2FA errors as-is', async () => {
		mockSdkLogin.mockRejectedValue(new Error('500 server'));
		await expect(loginTOTP({ user: 'john', password: 'p' } as any)).rejects.toThrow('500 server');
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Fix 4 regression — inquiry dispatch on reconnect
describe('connection status handler (Fix 4 regression)', () => {
	beforeEach(() => {
		mockConnectionOn.mockReset();
		mockStoreDispatch.mockReset();
		mockHasRole.mockReset();
		sdkMock.__setServer(undefined);
	});

	it('dispatches inquiryRequest on connected when user is a livechat-agent', async () => {
		mockHasRole.mockImplementation((r: string) => r === 'livechat-agent');
		await connect({ server: 'https://x.com' });
		const listener = getCapturedConnectionListener();
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: { token: 't' }, isAuthenticated: true },
			settings: {},
			server: { version: '6.0.0' }
		});
		listener('connected');
		await flushMicrotasks();
		const actions = mockStoreDispatch.mock.calls.map(([action]) => (action as any).type);
		expect(actions).toContain('INQUIRY_REQUEST');
	});

	it('does NOT dispatch inquiryRequest on connected when user has no livechat role', async () => {
		mockHasRole.mockReturnValue(false);
		await connect({ server: 'https://no-livechat.com' });
		const listener = getCapturedConnectionListener();
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: { token: 't' }, isAuthenticated: true },
			settings: {},
			server: { version: '6.0.0' }
		});
		listener('connected');
		await flushMicrotasks();
		const actions = mockStoreDispatch.mock.calls.map(([action]) => (action as any).type);
		expect(actions).not.toContain('INQUIRY_REQUEST');
	});
});

// Regression: stream-notify-all/stream-roles/stream-notify-logged handlers are wrapped in
// protectedFunction, which only catches synchronous throws. A fieldless payload reaching an
// async handler that destructures `ddpMessage.fields` without a guard would reject instead of
// throw, producing an unhandled promise rejection. Each handler must bail out early instead.
describe('connect — collection handlers guard against fieldless payloads', () => {
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

	it('ignores a stream-notify-all message with no fields instead of throwing', async () => {
		await connect({ server: 'https://example.com' });
		const [handler] = getHandlersByEvent('stream-notify-all');

		await expect(handler({ msg: 'added' })).resolves.toBeUndefined();
	});

	it('ignores a stream-roles message with no fields instead of throwing', async () => {
		await connect({ server: 'https://example.com' });
		const [handler] = getHandlersByEvent('stream-roles');

		expect(() => handler({ msg: 'added' })).not.toThrow();
		expect(onRolesChanged).not.toHaveBeenCalled();
	});

	it('ignores a stream-notify-logged message with no fields instead of throwing', async () => {
		await connect({ server: 'https://example.com' });
		const [handler] = getHandlersByEvent('stream-notify-logged');

		await expect(handler({ msg: 'added' })).resolves.toBeUndefined();
	});
});

describe('connect — stream-user-presence updates active users', () => {
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

	const fireUserPresence = (uid: string, status: number, statusText: string) => {
		const [handler] = getHandlersByEvent('stream-user-presence');
		handler({
			msg: 'changed',
			fields: { uid, args: [[uid, status, statusText, undefined, undefined]] }
		});
	};

	it('dispatches setActiveUsers with the presence for a user who is not the logged-in user', async () => {
		await connect({ server: SERVER });
		const setActiveUsersMock = jest.requireMock('../../actions/activeUsers').setActiveUsers;

		fireUserPresence('other-user-1', 1, 'online');

		expect(setActiveUsersMock).toHaveBeenCalledWith({
			'other-user-1': { status: STATUSES[1], statusText: 'online', statusSource: undefined, statusExpiresAt: undefined }
		});
	});

	it('still dispatches setActiveUsers for the logged-in user (in addition to setUser)', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: { id: 'me' }, isAuthenticated: false },
			settings: {},
			server: { version: '6.0.0' }
		});
		await connect({ server: SERVER });
		const setActiveUsersMock = jest.requireMock('../../actions/activeUsers').setActiveUsers;
		const setUserMock = jest.requireMock('../../actions/login').setUser;

		fireUserPresence('me', 1, 'online');

		expect(setActiveUsersMock).toHaveBeenCalledWith({
			me: { status: STATUSES[1], statusText: 'online', statusSource: undefined, statusExpiresAt: undefined }
		});
		expect(setUserMock).toHaveBeenCalledWith({
			status: STATUSES[1],
			statusText: 'online',
			statusSource: undefined,
			statusExpiresAt: undefined
		});
	});
});

describe('getWebsocketInfo', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns success when the probe socket connects', async () => {
		const { getWebsocketInfo } = require('./connect');
		mockCreateAndConnect.mockResolvedValue({ connection: { close: jest.fn() } });

		const result = await getWebsocketInfo({ server: 'https://example.com' });

		expect(result).toEqual({ success: true });
		expect(mockCreateAndConnect).toHaveBeenCalledWith('https://example.com');
	});

	it('returns a disabled message when the server rejects with 400', async () => {
		const { getWebsocketInfo } = require('./connect');
		mockCreateAndConnect.mockRejectedValue(new Error('Error: 400 bad request'));

		const result = await getWebsocketInfo({ server: 'https://example.com' });

		expect(result.success).toBe(false);
		expect(result.message).toMatch(/disabled/i);
	});

	it('falls back to the error message for non-400 failures', async () => {
		const { getWebsocketInfo } = require('./connect');
		mockCreateAndConnect.mockRejectedValue(new Error('boom'));

		const result = await getWebsocketInfo({ server: 'https://example.com' });

		expect(result.success).toBe(false);
		expect(result.message).toBe('boom');
	});
});
