jest.mock('~/lib/native/NativePrivacyCover', () => ({
	__esModule: true,
	default: {
		setEnabled: jest.fn(),
		getCoverToken: jest.fn(),
		releaseCover: jest.fn()
	}
}));

jest.mock('~/lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(),
	saveLastLocalAuthenticationSession: jest.fn()
}));

jest.mock('~/lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('~/lib/notifications', () => ({
	checkPendingNotification: jest.fn(() => Promise.resolve())
}));

jest.mock('~/lib/services/socketHealth', () => ({
	recoverSocket: jest.fn(() => Promise.resolve('confirmed-alive'))
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { APP_STATE } from '~/actions/actionsTypes';
import { appStart } from '~/actions/app';
import { loginSuccess } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { RootEnum } from '~/definitions/redux/TRootEnum';
import reducers from '~/reducers';
import stateRoot from '../state';
import NativePrivacyCover from '~/lib/native/NativePrivacyCover';
import { localAuthenticate } from '~/lib/methods/helpers/localAuthentication';
import { setUserPresenceOnline } from '~/lib/services/restApi';

const nativePrivacyCover = jest.mocked(NativePrivacyCover!);
const mockedLocalAuthenticate = jest.mocked(localAuthenticate);
const mockedSetUserPresenceOnline = jest.mocked(setUserPresenceOnline);

const HOST = 'https://open.rocket.chat';

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const setupStore = (root: RootEnum) => {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(stateRoot);
	store.dispatch(appStart({ root }));
	store.dispatch(selectServerSuccess({ server: HOST, name: 'open.rocket.chat', version: '6.0.0' }));
	store.dispatch(loginSuccess({ id: 'user-1', token: 'token-abc' } as any));
	return store;
};

const deferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>(res => {
		resolve = res;
	});
	return { promise, resolve };
};

describe('state saga — privacy cover on foreground', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('releases the cover for its own trip only after the lock decision completes', async () => {
		const lockDecision = deferred();
		mockedLocalAuthenticate.mockReturnValueOnce(lockDecision.promise);
		nativePrivacyCover.getCoverToken.mockReturnValueOnce(4);
		const store = setupStore(RootEnum.ROOT_INSIDE);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushPromises();

		expect(nativePrivacyCover.getCoverToken).toHaveBeenCalledTimes(1);
		expect(nativePrivacyCover.releaseCover).not.toHaveBeenCalled();

		lockDecision.resolve();
		await flushPromises();

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(4);
	});

	it('releases the cover without waiting for the presence update', async () => {
		mockedLocalAuthenticate.mockResolvedValueOnce(undefined);
		mockedSetUserPresenceOnline.mockReturnValueOnce(new Promise(() => {}));
		nativePrivacyCover.getCoverToken.mockReturnValueOnce(3);
		const store = setupStore(RootEnum.ROOT_INSIDE);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushPromises();

		expect(mockedSetUserPresenceOnline).toHaveBeenCalled();
		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(3);
	});

	it('releases the cover when authentication fails', async () => {
		mockedLocalAuthenticate.mockRejectedValueOnce(new Error('server record missing'));
		nativePrivacyCover.getCoverToken.mockReturnValueOnce(2);
		const store = setupStore(RootEnum.ROOT_INSIDE);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushPromises();

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(2);
	});

	it('releases the cover when the app is outside the signed-in area', async () => {
		nativePrivacyCover.getCoverToken.mockReturnValueOnce(1);
		const store = setupStore(RootEnum.ROOT_OUTSIDE);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushPromises();

		expect(mockedLocalAuthenticate).not.toHaveBeenCalled();
		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(1);
	});

	it('leaves the release to the newer foreground when one supersedes it', async () => {
		const firstLockDecision = deferred();
		mockedLocalAuthenticate.mockReturnValueOnce(firstLockDecision.promise).mockResolvedValueOnce(undefined);
		nativePrivacyCover.getCoverToken.mockReturnValueOnce(1).mockReturnValueOnce(2);
		const store = setupStore(RootEnum.ROOT_INSIDE);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushPromises();
		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushPromises();
		firstLockDecision.resolve();
		await flushPromises();

		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledTimes(1);
		expect(nativePrivacyCover.releaseCover).toHaveBeenCalledWith(2);
	});
});
