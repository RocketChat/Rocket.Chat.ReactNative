import { Alert, type AlertButton } from 'react-native';

import database from '../../database';
import { saveRoomSettings } from '../../services/restApi';
import { toggleRoomE2EE } from './toggleRoomE2EE';

jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(),
			write: jest.fn((callback: () => Promise<void>) => callback())
		}
	}
}));

jest.mock('../../services/restApi', () => ({
	saveRoomSettings: jest.fn()
}));

jest.mock('../../../i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key }
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockGet = database.active.get as jest.Mock;
const mockSaveRoomSettings = saveRoomSettings as jest.Mock;

/**
 * Minimal stand-in for a WatermelonDB row plus the staleness check the real one performs:
 * a record handle remembers the version it was fetched at, and updating it after another
 * writer touched the row throws, the same way WatermelonDB rejects diverged records.
 */
const createStore = (encrypted: boolean) => {
	const store = { encrypted, version: 0 };
	const updateErrors: Error[] = [];

	const find = jest.fn(() => {
		const fetchedAtVersion = store.version;
		return {
			get encrypted() {
				return store.encrypted;
			},
			update: (recipe: (record: { encrypted: boolean }) => void) => {
				if (store.version !== fetchedAtVersion) {
					const error = new Error('record has pending changes');
					updateErrors.push(error);
					throw error;
				}
				const draft = { encrypted: store.encrypted };
				recipe(draft);
				store.encrypted = draft.encrypted;
				store.version += 1;
			}
		};
	});

	mockGet.mockReturnValue({ find });

	// Simulates a stream event updating the row while the user stares at the alert
	const concurrentWrite = () => {
		store.version += 1;
	};

	return { store, updateErrors, concurrentWrite };
};

const getAlertButton = (text: string): AlertButton => {
	const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButton[];
	const button = buttons.find(b => b.text === text);
	if (!button) {
		throw new Error(`Alert button "${text}" not found`);
	}
	return button;
};

describe('toggleRoomE2EE', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('reverts on cancel even when a concurrent writer updated the record while the alert was open', async () => {
		const { store, updateErrors, concurrentWrite } = createStore(false);

		await toggleRoomE2EE('rid-1');
		expect(store.encrypted).toBe(true);

		concurrentWrite();

		await getAlertButton('Cancel').onPress?.();

		expect(store.encrypted).toBe(false);
		expect(updateErrors).toHaveLength(0);
	});

	it('reverts on a failed save even when a concurrent writer updated the record during the request', async () => {
		const { store, updateErrors, concurrentWrite } = createStore(false);
		mockSaveRoomSettings.mockImplementation(() => {
			concurrentWrite();
			return Promise.reject(new Error('network error'));
		});

		await toggleRoomE2EE('rid-1');
		expect(store.encrypted).toBe(true);

		await getAlertButton('Enable').onPress?.();

		expect(store.encrypted).toBe(false);
		expect(updateErrors).toHaveLength(0);
	});

	it('keeps the new value when the save succeeds', async () => {
		const { store } = createStore(false);
		mockSaveRoomSettings.mockResolvedValue({ result: true });

		await toggleRoomE2EE('rid-1');
		await getAlertButton('Enable').onPress?.();

		expect(store.encrypted).toBe(true);
		expect(mockSaveRoomSettings).toHaveBeenCalledWith('rid-1', { encrypted: true });
	});
});
