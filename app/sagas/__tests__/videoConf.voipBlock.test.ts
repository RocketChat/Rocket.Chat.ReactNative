jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('../../lib/services/restApi', () => ({
	videoConferenceStart: jest.fn(() => Promise.resolve({ success: false })),
	videoConferenceCancel: jest.fn(() => Promise.resolve({ success: true })),
	notifyUser: jest.fn(() => Promise.resolve(true))
}));

jest.mock('../../lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { handleVideoConfIncomingWebsocketMessages, initVideoCall } from '../../actions/videoConf';
import reducers from '../../reducers';
import videoConfRootSaga from '../videoConf';
import { isInActiveVoipCall } from '../../lib/services/voip/isInActiveVoipCall';
import { videoConferenceStart } from '../../lib/services/restApi';
import { showErrorAlert } from '../../lib/methods/helpers/info';

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
		jest.mocked(videoConferenceStart).mockClear();
		jest.mocked(showErrorAlert).mockClear();
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

	it('short-circuits outgoing INIT_CALL when isInActiveVoipCall returns true', async () => {
		jest.mocked(isInActiveVoipCall).mockReturnValue(true);

		const store = setupStoreWithVideoConfSaga();

		store.dispatch(initVideoCall({ mic: true, cam: false, direct: true, rid: 'room-1', uid: 'user-b' }));
		await flushSagaMicrotasks();

		expect(isInActiveVoipCall).toHaveBeenCalled();
		expect(videoConferenceStart).not.toHaveBeenCalled();
		expect(showErrorAlert).toHaveBeenCalled();
		expect(store.getState().videoConf.calling).toBe(false);
	});

	it('does not block outgoing INIT_CALL when VoIP is not active', async () => {
		const store = setupStoreWithVideoConfSaga();

		store.dispatch(initVideoCall({ mic: true, cam: false, direct: true, rid: 'room-1', uid: 'user-b' }));
		await flushSagaMicrotasks();

		expect(isInActiveVoipCall).toHaveBeenCalled();
		expect(showErrorAlert).not.toHaveBeenCalled();
		// Saga ran past the guard and reached `setCalling(true)`.
		expect(store.getState().videoConf.calling).toBe(true);
	});
});
