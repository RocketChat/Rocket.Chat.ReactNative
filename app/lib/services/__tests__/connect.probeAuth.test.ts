import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import WebSocket from 'universal-websocket-client';

import { getLoginServices, getWebsocketInfo } from '../connect';
import { headers } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import { MockConnection } from '~/lib/testUtils/sdkIntegration';

jest.unmock('@rocket.chat/sdk');

jest.mock('universal-websocket-client', () => jest.fn());

jest.mock('~/lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { reset: jest.fn(), drainPendingHangups: jest.fn() }
}));

jest.mock('~/lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('~/i18n', () => ({
	__esModule: true,
	default: { t: jest.fn((key: string) => key) }
}));

jest.mock('~/lib/methods/subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { setActiveDB: jest.fn(), servers: { get: jest.fn(), write: jest.fn() }, active: { get: jest.fn() } }
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn() }
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: { host: undefined }
}));

const PROBED_SERVER = 'https://probed.example';
const sentToNetwork = jest.fn((_url: string, _options: { headers: Record<string, string> }) =>
	Promise.resolve({ json: () => Promise.resolve({ success: true, services: [] }) } as Response)
);
const connections: MockConnection[] = [];
let handshakeHeaders: Record<string, string> = {};
const openSocket =
	(settle?: (connection: MockConnection) => void) =>
	(_url: string, _protocols: null, options: { headers: Record<string, string> }) => {
		handshakeHeaders = { ...options.headers };
		const connection = new MockConnection(connections);
		connection.close.mockImplementation(() => connection.onclose?.({ code: 1000 }));
		if (settle) {
			setImmediate(() => settle(connection));
		}
		return connection;
	};
const WebSocketMock = WebSocket as unknown as jest.Mock;

const originalGlobalFetch = global.fetch;
const originalCustomHeaders = RocketChatSettings.customHeaders;

beforeEach(() => {
	jest.clearAllMocks();
	connections.length = 0;
	WebSocketMock.mockImplementation(openSocket(connection => connection.onopen()));
	sentToNetwork.mockClear();
	global.fetch = sentToNetwork as unknown as typeof global.fetch;
	UserPreferences.removeItem(getBasicAuthKey(PROBED_SERVER));
	handshakeHeaders = {};
});

afterEach(() => {
	global.fetch = originalGlobalFetch;
	RocketChatSettings.customHeaders = originalCustomHeaders;
	UserPreferences.removeItem(getBasicAuthKey(PROBED_SERVER));
});

describe('getLoginServices — per-request basic auth', () => {
	it('sends the requested server its own stored basic auth instead of the active workspace one', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
		UserPreferences.setString(getBasicAuthKey(PROBED_SERVER), 'probed-credentials');

		await getLoginServices(PROBED_SERVER);

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic probed-credentials' });
	});

	it('sends no basic auth at all when the requested server has none stored', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };

		await getLoginServices(PROBED_SERVER);

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});
});

describe('getWebsocketInfo — handshake-only global auth', () => {
	it('points the shared headers at the probed server for the handshake, then hands back the active one', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
		UserPreferences.setString(getBasicAuthKey(PROBED_SERVER), 'probed-credentials');

		const result = await getWebsocketInfo({ server: PROBED_SERVER });

		expect(result).toEqual({ success: true });
		expect(handshakeHeaders).toMatchObject({ Authorization: 'Basic probed-credentials' });
		expect(RocketChatSettings.customHeaders).toMatchObject({ Authorization: 'Basic active-workspace' });
	});

	it('hands the active headers back before the handshake settles', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
		UserPreferences.setString(getBasicAuthKey(PROBED_SERVER), 'probed-credentials');
		WebSocketMock.mockImplementationOnce(openSocket());

		const pending = getWebsocketInfo({ server: PROBED_SERVER });

		expect(handshakeHeaders).toMatchObject({ Authorization: 'Basic probed-credentials' });
		expect(RocketChatSettings.customHeaders).toMatchObject({ Authorization: 'Basic active-workspace' });
		connections[0].onopen();
		await expect(pending).resolves.toEqual({ success: true });
	});

	it('sends no basic auth on the handshake when the probed server has none stored', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };

		const result = await getWebsocketInfo({ server: PROBED_SERVER });

		expect(result).toEqual({ success: true });
		expect(handshakeHeaders).not.toHaveProperty('Authorization');
		expect(RocketChatSettings.customHeaders).toMatchObject({ Authorization: 'Basic active-workspace' });
	});

	it('still hands the previous headers back when the handshake fails', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
		WebSocketMock.mockImplementationOnce(openSocket(connection => connection.onerror()));

		const result = await getWebsocketInfo({ server: PROBED_SERVER });

		expect(result).toEqual({ success: true });
		expect(RocketChatSettings.customHeaders).toMatchObject({ Authorization: 'Basic active-workspace' });
	});

	it('closes the socket when the probe is aborted before the handshake settles', async () => {
		WebSocketMock.mockImplementationOnce(openSocket());
		const controller = new AbortController();

		const pending = getWebsocketInfo({ server: PROBED_SERVER, signal: controller.signal });
		controller.abort();

		await expect(pending).resolves.toEqual({ success: true });
		expect(connections[0].close).toHaveBeenCalled();
	});
});
