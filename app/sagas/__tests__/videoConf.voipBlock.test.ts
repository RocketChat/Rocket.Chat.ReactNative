jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('~/lib/services/restApi', () => ({
	videoConferenceStart: jest.fn(() => Promise.resolve({ success: false })),
	videoConferenceCancel: jest.fn(() => Promise.resolve({ success: true })),
	notifyUser: jest.fn(() => Promise.resolve(true))
}));

jest.mock('~/lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));

jest.mock('~/lib/services/voip/endVoipCallForVideoConf', () => ({
	confirmEndVoipCallForVideoConf: jest.fn(() => Promise.resolve(true)),
	endVoipCallForVideoConf: jest.fn()
}));

jest.mock('~/lib/methods/helpers/notifications', () => ({
	hideNotification: jest.fn()
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { acceptCall, handleVideoConfIncomingWebsocketMessages, initVideoCall } from '~/actions/videoConf';
import reducers from '~/reducers';
import videoConfRootSaga from '../videoConf';
import { isInActiveVoipCall } from '~/lib/services/voip/isInActiveVoipCall';
import { confirmEndVoipCallForVideoConf, endVoipCallForVideoConf } from '~/lib/services/voip/endVoipCallForVideoConf';
import { notifyUser, videoConferenceStart } from '~/lib/services/restApi';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { ALLOW_CONCURRENT_INCOMING_CALLS } from '~/lib/constants/callWaiting';

/** Drains pending saga microtasks (takeEvery → call(onDirectCall) completes synchronously today). */
async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

/** `acceptCall` awaits the confirmation before its remaining effects, so it needs a deeper drain. */
async function flushSagaEffects(): Promise<void> {
	for (let i = 0; i < 10; i++) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
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
		jest.mocked(notifyUser).mockClear();
		jest.mocked(confirmEndVoipCallForVideoConf).mockReset().mockResolvedValue(true);
		jest.mocked(endVoipCallForVideoConf).mockReset();
	});

	function setupStoreWithVideoConfSaga() {
		const sagaMiddleware = createSagaMiddleware();
		const store = createStore(reducers, applyMiddleware(sagaMiddleware));
		sagaMiddleware.run(videoConfRootSaga);
		return store;
	}

	it.each([true, false])('surfaces incoming direct videoconf with isInActiveVoipCall %s', async voipActive => {
		expect(ALLOW_CONCURRENT_INCOMING_CALLS).toBe(true);
		jest.mocked(isInActiveVoipCall).mockReturnValue(voipActive);

		const store = setupStoreWithVideoConfSaga();

		store.dispatch(handleVideoConfIncomingWebsocketMessages({ action: envelope, params: undefined }));
		await flushSagaMicrotasks();

		expect(store.getState().videoConf.calls).toHaveLength(1);
		expect(store.getState().videoConf.calls[0]).toMatchObject({
			callId: 'vc-1',
			uid: 'user-b',
			rid: 'room-1',
			action: 'call'
		});
	});

	it('silently short-circuits outgoing INIT_CALL when isInActiveVoipCall returns true', async () => {
		jest.mocked(isInActiveVoipCall).mockReturnValue(true);

		const store = setupStoreWithVideoConfSaga();

		store.dispatch(initVideoCall({ mic: true, cam: false, direct: true, rid: 'room-1', uid: 'user-b' }));
		await flushSagaMicrotasks();

		expect(isInActiveVoipCall).toHaveBeenCalled();
		expect(videoConferenceStart).not.toHaveBeenCalled();
		// UI consumers disable the buttons; saga guard is a silent backstop — no alert.
		expect(showErrorAlert).not.toHaveBeenCalled();
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
	describe('accepting an incoming videoconf while a VoIP call is active', () => {
		// `onDirectCallCanceled` schedules a 1200ms accessibility announcement that would otherwise
		// fire after the environment is torn down.
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.clearAllTimers();
			jest.useRealTimers();
		});

		/** Rings an incoming direct videoconf and returns the store it landed in. */
		async function ringIncomingCall() {
			const store = setupStoreWithVideoConfSaga();
			store.dispatch(handleVideoConfIncomingWebsocketMessages({ action: envelope, params: undefined }));
			await flushSagaMicrotasks();
			expect(store.getState().videoConf.calls).toHaveLength(1);
			return store;
		}

		it('ends the VoIP call and accepts once the user confirms', async () => {
			jest.mocked(isInActiveVoipCall).mockReturnValue(true);
			const store = await ringIncomingCall();

			store.dispatch(acceptCall({ callId: 'vc-1' }));
			await flushSagaEffects();

			expect(confirmEndVoipCallForVideoConf).toHaveBeenCalledTimes(1);
			expect(endVoipCallForVideoConf).toHaveBeenCalledTimes(1);
			expect(notifyUser).toHaveBeenCalledWith('user-b/video-conference', {
				action: 'accepted',
				params: expect.objectContaining({ rid: 'room-1', callId: 'vc-1' })
			});
			expect(store.getState().videoConf.calls[0]).toMatchObject({ callId: 'vc-1', action: 'accepted' });
		});

		it('leaves the VoIP call and the incoming call untouched when the user dismisses', async () => {
			jest.mocked(isInActiveVoipCall).mockReturnValue(true);
			jest.mocked(confirmEndVoipCallForVideoConf).mockResolvedValue(false);
			const store = await ringIncomingCall();

			store.dispatch(acceptCall({ callId: 'vc-1' }));
			await flushSagaEffects();

			expect(endVoipCallForVideoConf).not.toHaveBeenCalled();
			expect(notifyUser).not.toHaveBeenCalled();
			// Still ringing, so the user can accept or reject it afterwards.
			expect(store.getState().videoConf.calls[0]).toMatchObject({ callId: 'vc-1', action: 'call' });
		});

		it('does not hang the VoIP call up when the caller gave up during the confirmation', async () => {
			jest.mocked(isInActiveVoipCall).mockReturnValue(true);
			const store = await ringIncomingCall();

			let confirm: (value: boolean) => void = () => undefined;
			jest.mocked(confirmEndVoipCallForVideoConf).mockReturnValue(
				new Promise<boolean>(resolve => {
					confirm = resolve;
				})
			);

			store.dispatch(acceptCall({ callId: 'vc-1' }));
			await flushSagaEffects();

			// Caller cancels while the alert is still on screen.
			store.dispatch(
				handleVideoConfIncomingWebsocketMessages({ action: { ...envelope, action: 'canceled' }, params: undefined })
			);
			await flushSagaEffects();
			confirm(true);
			await flushSagaEffects();

			expect(endVoipCallForVideoConf).not.toHaveBeenCalled();
			expect(notifyUser).not.toHaveBeenCalled();
		});

		it('accepts without asking when no VoIP call is active', async () => {
			const store = await ringIncomingCall();

			store.dispatch(acceptCall({ callId: 'vc-1' }));
			await flushSagaEffects();

			// The guard lives inside confirmEndVoipCallForVideoConf, which resolves true with no alert.
			expect(endVoipCallForVideoConf).toHaveBeenCalledTimes(1);
			expect(store.getState().videoConf.calls[0]).toMatchObject({ callId: 'vc-1', action: 'accepted' });
		});
	});
});
