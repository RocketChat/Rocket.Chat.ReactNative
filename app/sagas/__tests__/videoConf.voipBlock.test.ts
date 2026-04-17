jest.mock('../../lib/services/voip/voipBlocksIncomingVideoconf', () => ({
	voipBlocksIncomingVideoconf: jest.fn(() => false)
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { handleVideoConfIncomingWebsocketMessages } from '../../actions/videoConf';
import reducers from '../../reducers';
import videoConfRootSaga from '../videoConf';
import { voipBlocksIncomingVideoconf } from '../../lib/services/voip/voipBlocksIncomingVideoconf';

/** Drains pending saga microtasks (takeEvery → call(onDirectCall) completes synchronously today). */
async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('videoConf saga — VoIP / videoconf lock', () => {
	// First DDP arg is the envelope object; rooms.ts names it `action` in the tuple destructure.
	const envelope = {
		action: 'call' as const,
		params: { callId: 'vc-1', uid: 'user-b', rid: 'room-1' }
	};

	beforeEach(() => {
		jest.mocked(voipBlocksIncomingVideoconf).mockReset();
		jest.mocked(voipBlocksIncomingVideoconf).mockReturnValue(false);
	});

	function setupStoreWithVideoConfSaga() {
		const sagaMiddleware = createSagaMiddleware();
		const store = createStore(reducers, applyMiddleware(sagaMiddleware));
		sagaMiddleware.run(videoConfRootSaga);
		return store;
	}

	function dispatchIncomingCallLikeRooms(store: ReturnType<typeof setupStoreWithVideoConfSaga>): void {
		const [wsAction, wsParams] = [envelope, undefined] as const;
		store.dispatch(handleVideoConfIncomingWebsocketMessages({ action: wsAction, params: wsParams }));
	}

	it('short-circuits incoming direct videoconf when voipBlocksIncomingVideoconf returns true', async () => {
		jest.mocked(voipBlocksIncomingVideoconf).mockReturnValue(true);

		const store = setupStoreWithVideoConfSaga();
		const callsBefore = store.getState().videoConf.calls;

		dispatchIncomingCallLikeRooms(store);
		await flushSagaMicrotasks();

		expect(voipBlocksIncomingVideoconf).toHaveBeenCalled();
		expect(store.getState().videoConf.calls).toBe(callsBefore);
		expect(store.getState().videoConf.calls).toHaveLength(0);
	});

	it('handles incoming direct videoconf when VoIP does not block', async () => {
		const store = setupStoreWithVideoConfSaga();

		dispatchIncomingCallLikeRooms(store);
		await flushSagaMicrotasks();

		expect(voipBlocksIncomingVideoconf).toHaveBeenCalled();
		expect(store.getState().videoConf.calls).toHaveLength(1);
		expect(store.getState().videoConf.calls[0]).toMatchObject({
			callId: 'vc-1',
			uid: 'user-b',
			rid: 'room-1',
			action: 'call'
		});
	});
});
