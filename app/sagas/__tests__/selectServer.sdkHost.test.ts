jest.unmock('@rocket.chat/sdk');

const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

jest.mock('~/lib/methods/helpers/sslPinning', () => ({
	__esModule: true,
	default: undefined
}));

jest.mock('~/lib/services/connect', () => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(),
	getLoginServices: jest.fn(),
	getWebsocketInfo: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn(),
	logServerVersion: jest.fn()
}));

jest.mock('~/lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

import selectServerRoot from '../selectServer';
import { selectServerRequest } from '~/actions/server';
import { APP, SERVER } from '~/actions/actionsTypes';
import { RootEnum } from '~/definitions';
import sdk from '~/lib/services/sdk';
import { connect } from '~/lib/services/connect';
import UserPreferences from '~/lib/methods/userPreferences';
import { getServerUserIdKey, getUserTokenKey } from '~/lib/constants/keys';
import type { MockConnection } from '~/lib/testUtils/sdkIntegration';
import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';

const HOST = 'https://open.rocket.chat';
const USER_ID = 'user-open';
const TOKEN = 'token-open';

describe('selectServer saga — redundant select for the live SDK host', () => {
	beforeEach(() => {
		mockConnections.length = 0;
		jest.clearAllMocks();
		UserPreferences.removeItem(getServerUserIdKey(HOST));
		UserPreferences.removeItem(getUserTokenKey(HOST, USER_ID));
	});

	afterEach(() => {
		cancelSagaTasks();
		sdk.disconnect();
		UserPreferences.removeItem(getServerUserIdKey(HOST));
		UserPreferences.removeItem(getUserTokenKey(HOST, USER_ID));
	});

	it('reads the live host off the real SDK client and cancels the select without reconnecting', async () => {
		UserPreferences.setString(getServerUserIdKey(HOST), USER_ID);
		UserPreferences.setString(getUserTokenKey(HOST, USER_ID), TOKEN);
		sdk.initialize(HOST);
		expect(sdk.host).toBe(HOST);

		const { store, dispatchedActions } = createRecordingStore(selectServerRoot);

		store.dispatch(selectServerRequest(HOST, '7.0.0', false));
		await flushSagaMicrotasks();

		const insideIndex = dispatchedActions.findIndex(action => action.type === APP.START && action.root === RootEnum.ROOT_INSIDE);
		const cancelIndex = dispatchedActions.findIndex(action => action.type === SERVER.SELECT_CANCEL);

		expect(insideIndex).toBeGreaterThanOrEqual(0);
		expect(cancelIndex).toBeGreaterThan(insideIndex);
		expect(connect).not.toHaveBeenCalled();
	});

	it('reconnects and stays outside when the same host has no stored credentials (workspace retry)', async () => {
		sdk.initialize(HOST);
		expect(sdk.host).toBe(HOST);

		const { store, dispatchedActions } = createRecordingStore(selectServerRoot);

		store.dispatch(selectServerRequest(HOST, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(connect).toHaveBeenCalledWith({ server: HOST });
		const outsideIndex = dispatchedActions.findIndex(
			action => action.type === APP.START && action.root === RootEnum.ROOT_OUTSIDE
		);
		expect(outsideIndex).toBeGreaterThanOrEqual(0);
		expect(dispatchedActions.map(action => action.type)).not.toContain(SERVER.SELECT_CANCEL);
	});
});
