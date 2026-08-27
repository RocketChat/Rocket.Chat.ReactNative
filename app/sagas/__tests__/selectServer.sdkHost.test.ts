jest.unmock('@rocket.chat/sdk');

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

jest.mock('../../lib/methods/helpers/sslPinning', () => ({
	__esModule: true,
	default: undefined
}));

jest.mock('../../lib/services/connect', () => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(),
	getLoginServices: jest.fn(),
	getWebsocketInfo: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn(),
	logServerVersion: jest.fn()
}));

jest.mock('../../lib/services/twoFactor/twoFactor', () => ({
	twoFactor: jest.fn()
}));

import selectServerRoot from '../selectServer';
import { selectServerRequest } from '../../actions/server';
import { APP, SERVER } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import sdk from '../../lib/services/sdk';
import { connect } from '../../lib/services/connect';
import { cancelSagaTasks, createRecordingStore } from '../../lib/testUtils/sagaStore';
import { waitUntil } from '../../lib/testUtils/observedEffects';
import { createTransportFake } from '../../lib/testUtils/sdkTransport';

const HOST = 'https://open.rocket.chat';

describe('selectServer saga — redundant select for the live SDK host', () => {
	beforeEach(() => {
		mockTransport.reset();
	});

	afterEach(() => {
		cancelSagaTasks();
		sdk.disconnect();
	});

	it('reads the live host off the real SDK client and cancels the select without reconnecting', async () => {
		sdk.initialize(HOST);
		expect(sdk.host).toBe(HOST);

		const { store, dispatchedActions } = createRecordingStore(selectServerRoot);

		store.dispatch(selectServerRequest(HOST, '7.0.0', false));
		await waitUntil(() => dispatchedActions.some(action => action.type === SERVER.SELECT_CANCEL), {
			label: 'selectServer cancels the redundant select',
			observed: () => dispatchedActions.map(action => action.type)
		});

		const insideIndex = dispatchedActions.findIndex(action => action.type === APP.START && action.root === RootEnum.ROOT_INSIDE);
		const cancelIndex = dispatchedActions.findIndex(action => action.type === SERVER.SELECT_CANCEL);

		expect(insideIndex).toBeGreaterThanOrEqual(0);
		expect(cancelIndex).toBeGreaterThan(insideIndex);
		expect(connect).not.toHaveBeenCalled();
	});
});
