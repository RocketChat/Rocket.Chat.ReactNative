// ─── Boundary mocks — must appear before any import that triggers the module ───

jest.mock('../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn()
	}
}));

jest.mock('../../lib/database/services/Server', () => ({
	getServerById: jest.fn()
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('../../lib/methods/userPreferencesMethods', () => ({
	getSortPreferences: jest.fn(() => ({}))
}));

jest.mock('../../actions/deepLinking', () => ({
	deepLinkingClickCallPush: jest.fn()
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

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: jest.fn()
		}
	}
}));

// ─── Real imports (after mocks) ───────────────────────────────────────────────

import RNBootSplash from 'react-native-bootsplash';

import { appInit } from '../../actions/app';
import { RootEnum } from '../../definitions';
import initRoot from '../init';
import UserPreferences from '../../lib/methods/userPreferences';
import { getServerById } from '../../lib/database/services/Server';
import database from '../../lib/database';
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

	it('selects another logged in server with its own version when the stored server has no token', async () => {
		jest
			.mocked(UserPreferences.getString)
			.mockImplementation(key =>
				key === `reactnativemeteor_usertoken-${OTHER_HOST}`
					? 'token'
					: key.startsWith('reactnativemeteor_usertoken-')
						? null
						: HOST
			);
		jest.mocked(database.servers.get).mockReturnValue({
			query: () => ({ fetch: () => Promise.resolve([{ id: OTHER_HOST, version: '7.0.0' }]) })
		} as any);
		const { store } = setupStore();

		store.dispatch(appInit());
		await flushSagaMicrotasks();

		expect(store.getState().server.server).toBe(OTHER_HOST);
		expect(store.getState().server.version).toBe('7.0.0');
		expect(store.getState().app.ready).toBe(true);
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
