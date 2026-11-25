import { reloadAppAsync } from 'expo';
import { applyMiddleware, createStore, type AnyAction } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { APP_STATE } from '~/actions/actionsTypes';
import { RootEnum } from '~/definitions/redux/TRootEnum';
import { hasDeviceLanguageChanged } from '~/i18n';
import { localAuthenticate } from '~/lib/methods/helpers/localAuthentication';
import stateSaga from '../state';

jest.mock('expo', () => ({ reloadAppAsync: jest.fn(() => Promise.resolve()) }));

jest.mock('~/i18n', () => ({ hasDeviceLanguageChanged: jest.fn() }));

jest.mock('~/lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(),
	saveLastLocalAuthenticationSession: jest.fn()
}));

jest.mock('~/lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('~/lib/services/socketHealth', () => ({ recoverSocket: jest.fn(() => Promise.resolve()) }));

jest.mock('~/lib/notifications', () => ({ checkPendingNotification: jest.fn(() => Promise.resolve()) }));

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const signedInState = {
	app: { root: RootEnum.ROOT_INSIDE },
	login: { isAuthenticated: true },
	meteor: { connected: true },
	server: { server: 'https://open.rocket.chat' }
};

const comeBackToForeground = () => {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(
		(state: typeof signedInState = signedInState, _action: AnyAction) => state,
		applyMiddleware(sagaMiddleware)
	);
	sagaMiddleware.run(stateSaga);
	store.dispatch({ type: APP_STATE.FOREGROUND });
};

describe('coming back to the foreground', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('reloads the app instead of resuming when the device language changed', () => {
		jest.mocked(hasDeviceLanguageChanged).mockReturnValue(true);
		comeBackToForeground();
		expect(reloadAppAsync).toHaveBeenCalledTimes(1);
		expect(localAuthenticate).not.toHaveBeenCalled();
	});

	it('resumes without reloading when the device language is unchanged', () => {
		jest.mocked(hasDeviceLanguageChanged).mockReturnValue(false);
		comeBackToForeground();
		expect(reloadAppAsync).not.toHaveBeenCalled();
		expect(localAuthenticate).toHaveBeenCalledWith('https://open.rocket.chat');
	});
});
