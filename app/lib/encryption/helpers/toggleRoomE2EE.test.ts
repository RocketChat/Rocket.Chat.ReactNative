import { Alert, type AlertButton, type AlertOptions } from 'react-native';

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

interface IFakeRow {
	encrypted: boolean;
	version: number;
}

interface IFakeRecord {
	readonly encrypted: boolean;
	update: (recipe: (record: { encrypted: boolean }) => void) => void;
}

interface IFakeStore {
	store: IFakeRow;
	updateErrors: Error[];
	/** Simulates a stream event updating the row while the user stares at the alert */
	concurrentWrite: () => void;
}

/**
 * Minimal stand-in for a WatermelonDB row plus the staleness check the real one performs:
 * a record handle remembers the version it was fetched at, and updating it after another
 * writer touched the row throws, the same way WatermelonDB rejects diverged records.
 */
const createStore = (encrypted: boolean): IFakeStore => {
	const store: IFakeRow = { encrypted, version: 0 };
	const updateErrors: Error[] = [];

	const find = jest.fn((): IFakeRecord => {
		const fetchedAtVersion = store.version;
		return {
			get encrypted(): boolean {
				return store.encrypted;
			},
			update: (recipe: (record: { encrypted: boolean }) => void): void => {
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

	const concurrentWrite = (): void => {
		store.version += 1;
	};

	return { store, updateErrors, concurrentWrite };
};

const pressAlertButton = async (text: string): Promise<void> => {
	const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButton[];
	const button = buttons.find(b => b.text === text);
	if (!button) {
		throw new Error(`Alert button "${text}" not found`);
	}
	await (button.onPress as (() => Promise<void>) | undefined)?.();
};

/** Android: tapping outside the alert only fires the options' onDismiss */
const dismissAlert = async (): Promise<void> => {
	const options = (Alert.alert as jest.Mock).mock.calls[0][3] as AlertOptions | undefined;
	if (!options?.onDismiss) {
		throw new Error('Alert has no onDismiss handler');
	}
	await (options.onDismiss as () => Promise<void>)();
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

		await pressAlertButton('Cancel');

		expect(store.encrypted).toBe(false);
		expect(updateErrors).toHaveLength(0);
	});

	it('reverts when the alert is dismissed by tapping outside it', async () => {
		const { store, updateErrors } = createStore(false);

		await toggleRoomE2EE('rid-1');
		expect(store.encrypted).toBe(true);

		await dismissAlert();

		expect(store.encrypted).toBe(false);
		expect(updateErrors).toHaveLength(0);
		expect(mockSaveRoomSettings).not.toHaveBeenCalled();
	});

	it('reverts on an outside dismissal even when a concurrent writer updated the record', async () => {
		const { store, updateErrors, concurrentWrite } = createStore(false);

		await toggleRoomE2EE('rid-1');
		expect(store.encrypted).toBe(true);

		concurrentWrite();

		await dismissAlert();

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

		await pressAlertButton('Enable');

		expect(store.encrypted).toBe(false);
		expect(updateErrors).toHaveLength(0);
	});

	it('keeps the new value when the save succeeds', async () => {
		const { store } = createStore(false);
		mockSaveRoomSettings.mockResolvedValue({ result: true });

		await toggleRoomE2EE('rid-1');
		await pressAlertButton('Enable');

		expect(store.encrypted).toBe(true);
		expect(mockSaveRoomSettings).toHaveBeenCalledWith('rid-1', { encrypted: true });
	});
});
