import { waitFor } from '@testing-library/react-native';

import encryptionRoot from '../encryption';
import { encryptionDecodeKey, encryptionInit, encryptionStop } from '~/actions/encryption';
import { setUser } from '~/actions/login';
import { subscribeRoom } from '~/actions/room';
import { selectServerSuccess } from '~/actions/server';
import { addSettings } from '~/actions/settings';
import { E2E_BANNER_TYPE, E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY } from '~/lib/constants/keys';
import { type TAppDatabase } from '~/lib/database/interfaces';
import { Encryption } from '~/lib/encryption';
import { initStore } from '~/lib/store/auxStore';
import { readMessages } from '~/lib/methods/readMessages';
import UserPreferences from '~/lib/methods/userPreferences';
import sdk from '~/lib/services/sdk';
import { cancelSagaTasks, createRecordingStore } from '~/lib/testUtils/sagaStore';
import { createInMemoryAppDatabase } from '~/lib/testUtils/inMemoryDatabase';
import user from '~/lib/encryption/__tests__/fixtures/user.json';

jest.unmock('~/lib/encryption');

let mockDatabase: TAppDatabase;
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		},
		servers: { get: () => ({ find: () => Promise.reject(new Error('not found')) }) }
	}
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: { post: jest.fn(), get: jest.fn(), methodCallWrapper: jest.fn() }
}));

jest.mock('~/lib/methods/readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const SERVER_URL = 'https://open.rocket.chat';
const ROOM_ID = 'room-id';

const serverKeys = (keys: { public_key?: string; private_key?: string }) =>
	jest.mocked(sdk.get).mockImplementation((async (endpoint: string) => {
		if (endpoint === 'e2e.fetchMyKeys') {
			return { success: true, ...keys };
		}
		return { success: false };
	}) as typeof sdk.get);

const storeKeysLocally = () => {
	UserPreferences.setString(`${SERVER_URL}-${E2E_PUBLIC_KEY}`, user.publicKey);
	UserPreferences.setString(`${SERVER_URL}-${E2E_PRIVATE_KEY}`, user.privateKey);
};

const signedInStore = () => {
	const recording = createRecordingStore(encryptionRoot);
	initStore(recording.store);
	recording.store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.13.0', name: 'Open' }));
	recording.store.dispatch(setUser({ id: user.userId, token: 'token', username: 'web-fixture-user' }));
	recording.store.dispatch(addSettings({ E2E_Enable: true }));
	return recording;
};

const startEncryption = async () => {
	const { store } = signedInStore();
	store.dispatch(encryptionInit());
	await waitFor(() => expect(store.getState().encryption.enabled).toBe(true));
	return store;
};

beforeEach(() => {
	jest.clearAllMocks();
	mockDatabase = createInMemoryAppDatabase();
	[E2E_PUBLIC_KEY, E2E_PRIVATE_KEY, E2E_RANDOM_PASSWORD_KEY].forEach(key => UserPreferences.removeItem(`${SERVER_URL}-${key}`));
});

afterEach(() => {
	cancelSagaTasks();
	Encryption.stop();
});

describe('encryption saga — starting E2EE', () => {
	it('starts the client with the stored keys and shows no banner', async () => {
		storeKeysLocally();
		serverKeys({ public_key: user.publicKey, private_key: user.encodedPrivateKeyV2 });

		const store = await startEncryption();

		expect(store.getState().encryption.banner).toBe('');
		expect(Encryption.ready).toBe(true);
		expect(UserPreferences.getString(`${SERVER_URL}-${E2E_PRIVATE_KEY}`)).toBe(user.privateKey);
	});

	it('creates keys for a user without any and asks them to save the random password', async () => {
		serverKeys({});

		const store = await startEncryption();

		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.SAVE_PASSWORD);
		expect(Encryption.ready).toBe(true);
		expect(UserPreferences.getString(`${SERVER_URL}-${E2E_RANDOM_PASSWORD_KEY}`)).toEqual(expect.any(String));
	});

	it('keeps asking to save the random password while it is still stored', async () => {
		storeKeysLocally();
		UserPreferences.setString(`${SERVER_URL}-${E2E_RANDOM_PASSWORD_KEY}`, 'random password');
		serverKeys({ public_key: user.publicKey, private_key: user.encodedPrivateKeyV2 });

		const store = await startEncryption();

		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.SAVE_PASSWORD);
	});
});

describe('encryption saga — stopping E2EE', () => {
	it('hides the banner and stops the client', async () => {
		serverKeys({});
		const store = await startEncryption();

		store.dispatch(encryptionStop());

		await waitFor(() => expect(store.getState().encryption).toEqual(expect.objectContaining({ enabled: false, banner: '' })));
		expect(Encryption.ready).toBe(false);
	});
});

describe('encryption saga — decoding the private key', () => {
	it('starts the client and reads the open room once the password decodes the key', async () => {
		serverKeys({ public_key: user.publicKey, private_key: user.encodedPrivateKeyV2 });
		const { store } = signedInStore();
		store.dispatch(subscribeRoom(ROOM_ID));

		store.dispatch(encryptionDecodeKey(user.password));

		await waitFor(() => expect(readMessages).toHaveBeenCalledWith(ROOM_ID));
		expect(store.getState().encryption.enabled).toBe(true);
		expect(Encryption.ready).toBe(true);
	});
});
