jest.mock('../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn()
	}
}));

jest.mock('../../lib/services/restApi', () => ({
	e2eFetchMyKeys: jest.fn()
}));

jest.mock('../../lib/methods/readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../lib/encryption', () => ({
	Encryption: {
		initialize: jest.fn(),
		persistKeys: jest.fn(),
		createKeys: jest.fn(),
		decodePrivateKey: jest.fn(),
		stop: jest.fn()
	}
}));

const mockServersFind = jest.fn();

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: jest.fn(() => ({
				find: () => mockServersFind()
			}))
		}
	}
}));

import encryptionRoot from '../encryption';
import { encryptionInit } from '../../actions/encryption';
import { addSettings } from '../../actions/settings';
import { setUser, logout } from '../../actions/login';
import { selectServerSuccess, selectServerRequest } from '../../actions/server';
import UserPreferences from '../../lib/methods/userPreferences';
import { e2eFetchMyKeys } from '../../lib/services/restApi';
import { Encryption } from '../../lib/encryption';
import { E2E_BANNER_TYPE } from '../../lib/constants/keys';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../lib/testUtils/sagaStore';
import type { RecordingStore } from '../../lib/testUtils/sagaStore';

const setupStore = (): RecordingStore => createRecordingStore(encryptionRoot);

const SERVER_URL = 'https://open.rocket.chat';
const USER = { id: 'user-1', token: 'token-1', username: 'diego' };

const selectServerAndLogin = (store: RecordingStore['store']) => {
	store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.0.0', name: 'Open' }));
	store.dispatch(setUser(USER));
};

describe('encryption saga — settings arriving after ENCRYPTION.INIT', () => {
	beforeEach(() => {
		jest.mocked(UserPreferences.getString).mockReturnValue(null);
		jest.mocked(e2eFetchMyKeys).mockResolvedValue({ privateKey: 'private-key' } as any);
		mockServersFind.mockReset().mockRejectedValue(new Error('not found'));
	});

	afterEach(() => {
		cancelSagaTasks();
	});

	it('sets the banner once E2E_Enable arrives after ENCRYPTION.INIT', async () => {
		const { store } = setupStore();
		selectServerAndLogin(store);

		store.dispatch(encryptionInit());
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe('');

		store.dispatch(addSettings({ E2E_Enable: true }));
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.REQUEST_PASSWORD);
		expect(Encryption.initialize).not.toHaveBeenCalled();
	});

	it('sets the banner immediately when settings are already present', async () => {
		const { store } = setupStore();
		selectServerAndLogin(store);
		store.dispatch(addSettings({ E2E_Enable: true }));

		store.dispatch(encryptionInit());
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.REQUEST_PASSWORD);
	});

	it('leaves the banner unset when E2E_Enable arrives as false', async () => {
		const { store } = setupStore();
		selectServerAndLogin(store);

		store.dispatch(encryptionInit());
		await flushSagaMicrotasks();

		store.dispatch(addSettings({ E2E_Enable: false }));
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe('');
		expect(Encryption.initialize).not.toHaveBeenCalled();
	});

	it('sets the banner when the servers row exists with E2E_Enable undefined and settings arrive later', async () => {
		mockServersFind.mockResolvedValue({ E2E_Enable: undefined });

		const { store } = setupStore();
		selectServerAndLogin(store);

		store.dispatch(encryptionInit());
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe('');

		store.dispatch(addSettings({ E2E_Enable: true }));
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.REQUEST_PASSWORD);
	});

	it('stops waiting for settings once the user logs out', async () => {
		const { store } = setupStore();
		selectServerAndLogin(store);

		store.dispatch(encryptionInit());
		await flushSagaMicrotasks();

		store.dispatch(logout(true));
		await flushSagaMicrotasks();

		store.dispatch(addSettings({ E2E_Enable: true }));
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe('');
	});

	it('stops waiting for settings once a server switch is requested', async () => {
		const { store } = setupStore();
		selectServerAndLogin(store);

		store.dispatch(encryptionInit());
		await flushSagaMicrotasks();

		store.dispatch(selectServerRequest('https://other.rocket.chat', '7.0.0'));
		await flushSagaMicrotasks();

		store.dispatch(addSettings({ E2E_Enable: true }));
		await flushSagaMicrotasks();

		expect(store.getState().encryption.banner).toBe('');
		expect(Encryption.initialize).not.toHaveBeenCalled();
	});
});
