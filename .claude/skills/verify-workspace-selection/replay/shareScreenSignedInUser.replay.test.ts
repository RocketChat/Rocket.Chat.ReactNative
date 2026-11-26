jest.mock('~/lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn(),
		getBool: jest.fn(),
		setString: jest.fn(),
		removeItem: jest.fn()
	}
}));

jest.mock('~/lib/database/services/Server', () => ({
	getServerById: jest.fn()
}));

jest.mock('~/lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(),
	UserCanceledError: class UserCanceledError extends Error {}
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		host: null
	}
}));

jest.mock('~/lib/methods/helpers/sslPinning', () => ({
	applyServerCertificate: jest.fn(() => Promise.resolve()),
	registerCertificates: jest.fn(() => Promise.resolve())
}));

jest.mock('~/lib/methods/migrateTokenKeysToServerScoped', () => ({
	migrateTokenKeysToServerScoped: jest.fn(() => Promise.resolve())
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(() => Promise.resolve(null)),
		removeItem: jest.fn(() => Promise.resolve(null))
	}
}));

jest.mock('~/lib/services/voip/resetVoipState', () => ({
	resetVoipState: jest.fn()
}));

jest.mock('~/lib/services/connect', () => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(),
	loginOAuthOrSso: jest.fn(),
	login: jest.fn(),
	loginWithPassword: jest.fn()
}));

jest.mock('~/lib/methods/logout', () => ({
	logout: jest.fn(() => new Promise(() => {})),
	removeServerData: jest.fn(),
	removeServerDatabase: jest.fn()
}));

jest.mock('~/lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { init: jest.fn(), reset: jest.fn() }
}));

jest.mock('~/lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));

jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('~/lib/methods/getSettings', () => ({
	getLoginSettings: jest.fn(),
	setSettings: jest.fn(),
	subscribeSettings: jest.fn()
}));

jest.mock('~/lib/methods/getCustomEmojis', () => ({ getCustomEmojis: jest.fn(), setCustomEmojis: jest.fn() }));
jest.mock('~/lib/methods/getPermissions', () => ({ getPermissions: jest.fn(), setPermissions: jest.fn() }));
jest.mock('~/lib/methods/getRoles', () => ({ getRoles: jest.fn(), setRoles: jest.fn() }));
jest.mock('~/lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	setEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => false)
}));

jest.mock('~/lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));

import { all, fork } from 'redux-saga/effects';

import { deepLinkingOpen } from '~/actions/deepLinking';
import { logout } from '~/actions/login';
import { RootEnum } from '~/definitions/redux/TRootEnum';
import deepLinkingRoot from '~/sagas/deepLinking';
import initRoot from '~/sagas/init';
import loginRoot from '~/sagas/login';
import selectServerRoot from '~/sagas/selectServer';
import UserPreferences from '~/lib/methods/userPreferences';
import { getServerById } from '~/lib/database/services/Server';
import sdk from '~/lib/services/sdk';
import { CURRENT_SERVER, getServerUserIdKey, getUserTokenKey } from '~/lib/constants/keys';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { PreloadedState } from '~/lib/testUtils/sagaStore';

const HOST = 'https://open.rocket.chat';
const USER_ID = 'user-1';

const rootSaga = function* rootSaga() {
	yield all([fork(deepLinkingRoot), fork(initRoot), fork(selectServerRoot), fork(loginRoot)]);
};

const storePreferences = (preferences: Record<string, string>) =>
	jest.mocked(UserPreferences.getString).mockImplementation((key: string) => preferences[key] ?? null);

const recordRoots = (store: ReturnType<typeof createRecordingStore>['store']) => {
	const roots: { root: RootEnum; token: string | undefined }[] = [];
	store.subscribe(() => {
		const { root } = store.getState().app;
		if (roots.at(-1)?.root !== root) {
			roots.push({ root, token: store.getState().login.user?.token });
		}
	});
	return roots;
};

describe('replay: shareScreenHasSignedInUser', () => {
	beforeEach(() => {
		jest.mocked(getServerById).mockResolvedValue({ id: HOST, version: '7.0.0' } as any);
		(sdk as any).host = HOST;
	});

	afterEach(() => {
		cancelSagaTasks();
		(sdk as any).host = null;
	});

	it('shows the share screen without a user when the connected workspace has a userId but no token', async () => {
		storePreferences({ [CURRENT_SERVER]: HOST, [getServerUserIdKey(HOST)]: USER_ID });
		const { store } = createRecordingStore(rootSaga, {
			app: { root: RootEnum.ROOT_OUTSIDE }
		} as PreloadedState);
		const roots = recordRoots(store);

		store.dispatch(deepLinkingOpen({ type: 'shareextension', mediaUris: 'file:///photo.jpg' } as any));
		await flushSagaMicrotasks();

		expect(roots).toContainEqual({ root: RootEnum.ROOT_SHARE_EXTENSION, token: undefined });
	});

	it('shows the share screen without a user when the share arrives while logging out', async () => {
		storePreferences({
			[CURRENT_SERVER]: HOST,
			[getServerUserIdKey(HOST)]: USER_ID,
			[getUserTokenKey(HOST, USER_ID)]: 'token'
		});
		const { store } = createRecordingStore(rootSaga, {
			app: { root: RootEnum.ROOT_INSIDE },
			server: { server: HOST, version: '7.0.0', connected: true } as any,
			login: { user: { id: USER_ID, token: 'token' }, isAuthenticated: true } as any
		} as PreloadedState);
		const roots = recordRoots(store);

		store.dispatch(logout());
		await flushSagaMicrotasks();
		store.dispatch(deepLinkingOpen({ type: 'shareextension', mediaUris: 'file:///photo.jpg' } as any));
		await flushSagaMicrotasks();

		expect(roots).toContainEqual({ root: RootEnum.ROOT_SHARE_EXTENSION, token: undefined });
	});
});
