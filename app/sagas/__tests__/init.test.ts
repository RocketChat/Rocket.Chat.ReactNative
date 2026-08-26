jest.mock('../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn()
	}
}));

jest.mock('../../lib/database/services/Server', () => ({
	getServerById: jest.fn(),
	getAllServers: jest.fn()
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('../../lib/methods/userPreferencesMethods', () => ({
	getSortPreferences: jest.fn(() => ({}))
}));

jest.mock('react-native-bootsplash', () => ({
	__esModule: true,
	default: { hide: jest.fn(() => Promise.resolve()) }
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(() => Promise.resolve(null)),
		removeItem: jest.fn(() => Promise.resolve(null))
	}
}));

import RNBootSplash from 'react-native-bootsplash';

import { appInit, appStart } from '../../actions/app';
import { RootEnum } from '../../definitions';
import initRoot from '../init';
import UserPreferences from '../../lib/methods/userPreferences';
import { getAllServers, getServerById } from '../../lib/database/services/Server';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEEP_LINKING } from '../../actions/actionsTypes';
import { TOKEN_KEY } from '../../lib/constants/keys';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../lib/testUtils/sagaStore';
import type { RecordingStore } from '../../lib/testUtils/sagaStore';

const setupStore = (): RecordingStore => createRecordingStore(initRoot);

const HOST = 'https://open.rocket.chat';
const OTHER_HOST = 'https://other.rocket.chat';

describe('init saga — restore user-facing roots', () => {
	beforeEach(() => {
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(RNBootSplash.hide).mockClear();
		jest.mocked(AsyncStorage.getItem).mockResolvedValue(null as any);
		jest.mocked(AsyncStorage.removeItem).mockClear();
		jest.mocked(getAllServers).mockResolvedValue([]);
		jest.mocked(UserPreferences.getString).mockImplementation(() => HOST);
	});

	afterEach(() => {
		cancelSagaTasks();
	});

	it('lands on ROOT_OUTSIDE and hides the splash when the stored server has no database record', async () => {
		jest.mocked(getServerById).mockResolvedValue(null);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
		expect(jest.mocked(RNBootSplash.hide)).toHaveBeenCalled();
	});

	it('marks the app ready when the stored server has no database record', async () => {
		jest.mocked(getServerById).mockResolvedValue(null);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().app.ready).toBe(true);
	});

	it('lands on ROOT_OUTSIDE when no server is stored at all', async () => {
		jest.mocked(UserPreferences.getString).mockImplementation(() => null);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
		expect(store.getState().app.ready).toBe(true);
	});

	it('lands on ROOT_OUTSIDE when neither the stored server nor any other has a token', async () => {
		jest.mocked(UserPreferences.getString).mockImplementation(key => (key.startsWith(`${TOKEN_KEY}-`) ? null : HOST));
		jest.mocked(getAllServers).mockResolvedValue([{ id: OTHER_HOST, version: '7.0.0' }] as any);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
		expect(store.getState().app.ready).toBe(true);
	});

	it('selects another logged in server with its own version when the stored server has no token', async () => {
		jest.mocked(UserPreferences.getString).mockImplementation(key => {
			if (key === `${TOKEN_KEY}-${OTHER_HOST}`) return 'token';
			if (key.startsWith(`${TOKEN_KEY}-`)) return null;
			return HOST;
		});
		jest.mocked(getAllServers).mockResolvedValue([{ id: OTHER_HOST, version: '7.0.0' }] as any);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().server.server).toBe(OTHER_HOST);
		expect(store.getState().server.version).toBe('7.0.0');
		expect(store.getState().app.ready).toBe(true);
	});

	it('delivers the pending push notification without stranding the boot', async () => {
		jest.mocked(getServerById).mockResolvedValue({ id: HOST, version: '6.0.0' } as any);
		jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ rid: 'room-1' }) as any);
		const { store, dispatchedActions } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(dispatchedActions).toContainEqual({ type: DEEP_LINKING.OPEN_VIDEO_CONF, params: { rid: 'room-1' } });
		expect(store.getState().server.server).toBe(HOST);
	});

	it('keeps the selected server when the stored push notification payload is malformed', async () => {
		jest.mocked(getServerById).mockResolvedValue({ id: HOST, version: '6.0.0' } as any);
		jest.mocked(AsyncStorage.getItem).mockResolvedValue('not json' as any);
		const { store, dispatchedActions } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().server.server).toBe(HOST);
		expect(store.getState().app.root).not.toBe(RootEnum.ROOT_OUTSIDE);
		expect(dispatchedActions).not.toContainEqual(expect.objectContaining({ type: DEEP_LINKING.OPEN_VIDEO_CONF }));
	});

	it('delivers the pending push notification even when the root has already moved outside', async () => {
		jest.mocked(getServerById).mockResolvedValue({ id: HOST, version: '6.0.0' } as any);
		jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ rid: 'room-1' }) as any);
		const { store, dispatchedActions } = setupStore();

		store.dispatch(appInit());
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		await flushSagaMicrotasks();

		expect(dispatchedActions).toContainEqual({ type: DEEP_LINKING.OPEN_VIDEO_CONF, params: { rid: 'room-1' } });
	});

	it('drops the pending push notification when the boot lands on ROOT_OUTSIDE', async () => {
		jest.mocked(getServerById).mockResolvedValue(null);
		jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ rid: 'room-1' }) as any);
		const { store, dispatchedActions } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
		expect(jest.mocked(AsyncStorage.removeItem)).toHaveBeenCalledWith('pushNotification');
		expect(dispatchedActions).not.toContainEqual(expect.objectContaining({ type: DEEP_LINKING.OPEN_VIDEO_CONF }));
	});

	it('selects the stored server and marks the app ready when the record exists', async () => {
		jest.mocked(getServerById).mockResolvedValue({ id: HOST, version: '6.0.0' } as any);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().app.ready).toBe(true);
		expect(store.getState().server.server).toBe(HOST);
	});
});
