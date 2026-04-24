jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { handleVideoConfIncomingWebsocketMessages } from '../../actions/videoConf';
import reducers from '../../reducers';
import videoConfRootSaga from '../videoConf';
import { isInActiveVoipCall } from '../../lib/services/voip/isInActiveVoipCall';

/** Drains pending saga microtasks (takeEvery → call(onDirectCall) completes synchronously today). */
async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('videoConf saga — VoIP / videoconf lock', () => {
	// Mirrors the first DDP arg destructured at app/lib/methods/subscriptions/rooms.ts
	// and dispatched as `{ action, params }` into handleVideoConfIncomingWebsocketMessages.
	const envelope = {
		action: 'call' as const,
		params: { callId: 'vc-1', uid: 'user-b', rid: 'room-1' }
	};

	beforeEach(() => {
		jest.mocked(isInActiveVoipCall).mockReset();
		jest.mocked(isInActiveVoipCall).mockReturnValue(false);
	});

	function setupStoreWithVideoConfSaga() {
		const sagaMiddleware = createSagaMiddleware();
		const store = createStore(reducers, applyMiddleware(sagaMiddleware));
		sagaMiddleware.run(videoConfRootSaga);
		return store;
	}

	it('short-circuits incoming direct videoconf when isInActiveVoipCall returns true', async () => {
		jest.mocked(isInActiveVoipCall).mockReturnValue(true);

		const store = setupStoreWithVideoConfSaga();
		const callsBefore = store.getState().videoConf.calls;

		store.dispatch(handleVideoConfIncomingWebsocketMessages({ action: envelope, params: undefined }));
		await flushSagaMicrotasks();

		expect(isInActiveVoipCall).toHaveBeenCalled();
		expect(store.getState().videoConf.calls).toBe(callsBefore);
		expect(store.getState().videoConf.calls).toHaveLength(0);
	});

	it('handles incoming direct videoconf when VoIP does not block', async () => {
		const store = setupStoreWithVideoConfSaga();

		store.dispatch(handleVideoConfIncomingWebsocketMessages({ action: envelope, params: undefined }));
		await flushSagaMicrotasks();

		expect(isInActiveVoipCall).toHaveBeenCalled();
		expect(store.getState().videoConf.calls).toHaveLength(1);
		expect(store.getState().videoConf.calls[0]).toMatchObject({
			callId: 'vc-1',
			uid: 'user-b',
			rid: 'room-1',
			action: 'call'
		});
	});
});
