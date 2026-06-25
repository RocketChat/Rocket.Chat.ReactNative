import { connect, determineAuthType, disconnect } from './connect';
import { mediaSessionInstance } from './voip/MediaSessionInstance';
import { pendingHangups } from './voip/pendingHangups';
import { unsubscribeRooms } from '../methods/subscribeRooms';
import { setUser } from '../../actions/login';
import database from '../database';

jest.mock('./voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { reset: jest.fn(), drainPendingHangups: jest.fn() }
}));

// Mock the isIOS helper
jest.mock('../methods/helpers/deviceInfo', () => ({
	...jest.requireActual('../methods/helpers/deviceInfo'),
	isIOS: false
}));

const mockOnStreamDataStops: jest.Mock[] = [];
const mockOnStreamData = jest.fn<Promise<{ stop: jest.Mock }>, [string, (...args: any[]) => void]>(() => {
	const stop = jest.fn();
	mockOnStreamDataStops.push(stop);
	return Promise.resolve({ stop });
});
const mockSdkConnect = jest.fn<Promise<void>, []>(() => Promise.resolve());
const mockSdkAbort = jest.fn<void, []>();
const mockSdkDisconnect = jest.fn<void, []>();
const mockSdkInitialize = jest.fn<void, [string]>();
const mockSdkCurrent = {
	onStreamData: (event: string, cb: (...args: any[]) => void) => mockOnStreamData(event, cb),
	connect: () => mockSdkConnect(),
	abort: () => mockSdkAbort()
};
jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		initialize: (server: string) => mockSdkInitialize(server),
		disconnect: () => mockSdkDisconnect(),
		get current() {
			return mockSdkCurrent;
		}
	}
}));

type MockStoreState = {
	meteor: { connected: boolean };
	login: { user: unknown; isAuthenticated: boolean };
	settings: Record<string, unknown>;
};
const mockStoreGetState = jest.fn<MockStoreState, []>(() => ({
	meteor: { connected: false },
	login: { user: null, isAuthenticated: false },
	settings: {}
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
	default: {
		setActiveDB: jest.fn(),
		active: { get: jest.fn() }
	}
}));

jest.mock('../methods/subscribeRooms', () => ({
	unsubscribeRooms: jest.fn()
}));

jest.mock('../methods/getSettings', () => ({
	getSettings: jest.fn()
}));

jest.mock('../methods/helpers/events', () => ({
	__esModule: true,
	default: { emit: jest.fn(), on: jest.fn(), removeListener: jest.fn() }
}));

const mockLog = jest.fn<void, unknown[]>();
jest.mock('../methods/helpers/log', () => ({
	__esModule: true,
	default: (...args: unknown[]) => mockLog(...args)
}));

const flushMicrotasks = async (): Promise<void> => {
	for (let i = 0; i < 5; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
};

const getHandlersByEvent = (event: string): Array<(...args: unknown[]) => void> =>
	mockOnStreamData.mock.calls.filter(([e]) => e === event).map(([, cb]) => cb);

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

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
			expect(result).toBe('saml'); // Should continue to next conditions
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
			expect(result).toBe('saml'); // Should continue to next conditions
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
			expect(result).toBe('not_supported'); // Should fall through to not_supported since isIOS is mocked as false
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
			expect(result).toBe('not_supported'); // Should fall through to not_supported since isIOS is mocked as false
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
			expect(result).toBe('oauth'); // name 'github' should be used
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
			expect(result).toBe('oauth'); // service 'facebook' should be used
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
			expect(result).toBe('oauth'); // service 'google' should be used
		});
	});

	describe('priority order', () => {
		it('should prioritize oauth_custom over other types', () => {
			const services: IServices = {
				name: 'github', // This would normally return 'oauth'
				custom: true,
				showButton: true,
				buttonLabelText: 'Custom GitHub',
				service: 'github'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth_custom'); // Should return oauth_custom first
		});

		it('should prioritize saml over oauth', () => {
			const services: IServices = {
				name: 'github', // This would normally return 'oauth'
				custom: false,
				showButton: true,
				buttonLabelText: 'SAML GitHub',
				service: 'saml'
			};

			const result = determineAuthType(services);
			expect(result).toBe('saml'); // Should return saml before checking for oauth
		});

		it('should prioritize cas over oauth', () => {
			const services: IServices = {
				name: 'github', // This would normally return 'oauth'
				custom: false,
				showButton: true,
				buttonLabelText: 'CAS GitHub',
				service: 'cas'
			};

			const result = determineAuthType(services);
			expect(result).toBe('cas'); // Should return cas before checking for oauth
		});
	});
});

describe('VoIP media session lifecycle (disconnect)', () => {
	it('calls mediaSessionInstance.reset when disconnect runs', () => {
		disconnect();
		expect(mediaSessionInstance.reset).toHaveBeenCalledTimes(1);
	});
});

describe('connect — pendingHangups drain on reconnect', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockOnStreamDataStops.length = 0;
		pendingHangups.clear();
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: null, isAuthenticated: false },
			settings: {}
		});
	});

	it('drains pendingHangups via mediaSessionInstance after close → connected', async () => {
		pendingHangups.record('call-a');
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: true },
			settings: {}
		});

		await connect({ server: 'https://example.com' });

		const connectedHandlers = getHandlersByEvent('connected');
		const closeHandlers = getHandlersByEvent('close');
		const drainHandler = connectedHandlers[1];
		const closeHandler = closeHandlers[0];

		closeHandler();
		drainHandler();
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).toHaveBeenCalledTimes(1);
	});

	it('does not drain when "connected" fires without a prior "close"', async () => {
		pendingHangups.record('call-a');
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: true },
			settings: {}
		});

		await connect({ server: 'https://example.com' });

		const drainHandler = getHandlersByEvent('connected')[1];

		drainHandler();
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).not.toHaveBeenCalled();
	});

	it('skips drainPendingHangups when pendingHangups is empty', async () => {
		mockStoreGetState.mockReturnValue({
			meteor: { connected: true },
			login: { user: null, isAuthenticated: true },
			settings: {}
		});

		await connect({ server: 'https://example.com' });

		const drainHandler = getHandlersByEvent('connected')[1];
		const closeHandler = getHandlersByEvent('close')[0];

		closeHandler();
		drainHandler();
		await flushMicrotasks();

		expect(mediaSessionInstance.drainPendingHangups).not.toHaveBeenCalled();
	});

	it('stops the previous pendingHangups connected listener when connect runs again', async () => {
		await connect({ server: 'https://example.com' });
		// onStreamData call order: 'connecting', 'connected', 'close', 'connected' (drain), ...
		// pendingHangupsConnectedListener is the second 'connected' registration — index 3.
		const firstDrainStop = mockOnStreamDataStops[3];

		await connect({ server: 'https://example.com' });
		await flushMicrotasks();

		expect(firstDrainStop).toHaveBeenCalled();
	});
});

describe('connect — rooms subscription guard reset on close', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockOnStreamDataStops.length = 0;
		mockStoreGetState.mockReturnValue({
			meteor: { connected: false },
			login: { user: null, isAuthenticated: false },
			settings: {}
		});
	});

	// Regression: a long background marks the DDP socket stale, so foregrounding triggers
	// `checkAndReopen` → `forceReopen`, which wipes the SDK subscriptions and emits 'close' while
	// bypassing `connect()`. The rooms-list `stream-notify-user` feed only re-subscribes when the
	// module-level guard in `subscribeRooms` is clear, and `unsubscribeRooms()` is what clears it.
	// If the 'close' handler stops calling `unsubscribeRooms()`, the guard stays set after reconnect
	// and the rooms list silently stops updating (subscriptions/favorites/reads).
	it('calls unsubscribeRooms when the socket "close" fires', async () => {
		await connect({ server: 'https://example.com' });

		// connect() itself calls unsubscribeRooms() once while tearing down prior listeners; ignore it.
		(unsubscribeRooms as jest.Mock).mockClear();

		const closeHandler = getHandlersByEvent('close')[0];
		closeHandler();

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
		mockOnStreamDataStops.length = 0;
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
