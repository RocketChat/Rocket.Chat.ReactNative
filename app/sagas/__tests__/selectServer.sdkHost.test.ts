jest.unmock('@rocket.chat/sdk');

const mockConnections: any[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual('../../lib/testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

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

jest.mock('../../lib/services/twoFactor', () => ({
	twoFactor: jest.fn()
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import selectServerRoot from '../selectServer';
import { selectServerRequest } from '../../actions/server';
import { APP, SERVER } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import sdk from '../../lib/services/sdk';
import { connect } from '../../lib/services/connect';

async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 20; i += 1) {
		await new Promise(resolve => setImmediate(resolve));
	}
}

const HOST = 'https://open.rocket.chat';

describe('selectServer saga — redundant select for the live SDK host', () => {
	afterEach(() => {
		sdk.disconnect();
	});

	it('reads the live host off the real SDK client and cancels the select without reconnecting', async () => {
		sdk.initialize(HOST);
		expect(sdk.current.client.host).toBe(HOST);

		const dispatched: Record<string, any>[] = [];
		const sagaMiddleware = createSagaMiddleware();
		const store = createStore(
			reducers,
			applyMiddleware(
				() => next => action => {
					dispatched.push(action);
					return next(action);
				},
				sagaMiddleware
			)
		);
		sagaMiddleware.run(selectServerRoot);

		store.dispatch(selectServerRequest(HOST, '7.0.0', false));
		await flushSagaMicrotasks();

		const insideIndex = dispatched.findIndex(action => action.type === APP.START && action.root === RootEnum.ROOT_INSIDE);
		const cancelIndex = dispatched.findIndex(action => action.type === SERVER.SELECT_CANCEL);

		expect(insideIndex).toBeGreaterThanOrEqual(0);
		expect(cancelIndex).toBeGreaterThan(insideIndex);
		expect(connect).not.toHaveBeenCalled();
	});
});
