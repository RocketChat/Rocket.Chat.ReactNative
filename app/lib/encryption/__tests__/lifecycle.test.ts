import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import EJSON from 'ejson';

import Encryption from '../encryption';
import sdk from '../../services/sdk';
import UserPreferences from '../../methods/userPreferences';
import { E2E_BANNER_TYPE, E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY } from '../../constants/keys';
import { type TAppDatabase } from '../../database/interfaces';
import { type IMessage } from '~/definitions';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';
import messages from './fixtures/messages.json';
import roomKeys from './fixtures/roomKeys.json';
import user from './fixtures/user.json';

let mockDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: { post: jest.fn(), get: jest.fn(), methodCallWrapper: jest.fn() }
}));

const mockState = {
	server: { version: '7.13.0' },
	settings: {},
	encryption: { enabled: true, banner: '' }
};
jest.mock('../../store/auxStore', () => ({
	store: { getState: () => mockState }
}));

const SERVER = 'https://open.rocket.chat';
const ROOM_ID = 'room-id';
const NEW_PASSWORD = 'a brand new E2E password';

const encryptedMessage = {
	_id: 'message-id',
	rid: ROOM_ID,
	t: 'e2e',
	e2e: 'pending',
	content: messages.v2
} as unknown as IMessage;

const seedEncryptedRoom = () =>
	mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: ROOM_ID }, subscriptions.schema);
			subscription.rid = ROOM_ID;
			subscription.encrypted = true;
			subscription.E2EKey = roomKeys.v2.E2EKey;
			subscription.e2eKeyId = roomKeys.v2.keyID;
		});
	});

const signIn = async () => {
	await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
};

const sentKeys = () => {
	const call = jest.mocked(sdk.post).mock.calls.find(([endpoint]) => endpoint === 'e2e.setUserPublicAndPrivateKeys');
	expect(call).toBeDefined();
	return call?.[1] as unknown as { public_key: string; private_key: string; force?: boolean };
};

beforeEach(async () => {
	jest.clearAllMocks();
	UserPreferences.removeItem(`${SERVER}-${E2E_PUBLIC_KEY}`);
	UserPreferences.removeItem(`${SERVER}-${E2E_PRIVATE_KEY}`);
	UserPreferences.removeItem(`${SERVER}-${E2E_RANDOM_PASSWORD_KEY}`);
	mockState.server.version = '7.13.0';
	mockState.encryption = { enabled: true, banner: '' };
	mockDatabase = createInMemoryAppDatabase();
	await seedEncryptedRoom();
});

afterEach(() => {
	Encryption.stop();
});

describe('initialize', () => {
	it('releases work waiting for the client', async () => {
		const waiting = Encryption.establishing;

		Encryption.initialize(user.userId);

		await expect(waiting).resolves.toBeUndefined();
		expect(Encryption.ready).toBe(true);
	});
});

describe('establishing', () => {
	it.each([
		['E2E is disabled for the user', { enabled: false, banner: '' }],
		['the user has not entered the E2E password', { enabled: true, banner: E2E_BANNER_TYPE.REQUEST_PASSWORD }]
	])('rejects work even after initialize while %s', async (_reason, encryptionState) => {
		mockState.encryption = encryptionState;
		Encryption.initialize(user.userId);

		await expect(Encryption.establishing).rejects.toBeUndefined();
	});
});

describe('stop', () => {
	it('rejects work waiting for a client that never initialized', async () => {
		const waiting = Encryption.establishing;

		Encryption.stop();

		await expect(waiting).rejects.toBeUndefined();
	});

	it('forgets the keys and room sessions, so messages no longer decrypt', async () => {
		await signIn();
		expect((await Encryption.decryptMessage(encryptedMessage)).msg).toBe(messages.plaintext.msg);

		Encryption.stop();

		expect(await Encryption.decryptMessage(encryptedMessage)).toEqual(encryptedMessage);
	});

	it('holds new work until the next sign in', async () => {
		await signIn();
		Encryption.stop();
		let released = false;
		const waiting = Encryption.establishing.then(() => {
			released = true;
		});
		await new Promise(resolve => setImmediate(resolve));
		expect(released).toBe(false);

		await signIn();

		await waiting;
		expect(Encryption.ready).toBe(true);
	});
});

describe('persistKeys', () => {
	it('stores the key pair for the server and unlocks room keys with the private key', async () => {
		await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);

		expect(EJSON.parse(UserPreferences.getString(`${SERVER}-${E2E_PUBLIC_KEY}`) as string)).toEqual(JSON.parse(user.publicKey));
		expect(UserPreferences.getString(`${SERVER}-${E2E_PRIVATE_KEY}`)).toBe(user.privateKey);
		expect((await Encryption.decryptMessage(encryptedMessage)).msg).toBe(messages.plaintext.msg);
	});
});

describe('createKeys', () => {
	it('sends the server a new key pair whose private key the stored random password unlocks', async () => {
		await Encryption.createKeys(user.userId, SERVER);

		const { public_key, private_key } = sentKeys();
		const randomPassword = UserPreferences.getString(`${SERVER}-${E2E_RANDOM_PASSWORD_KEY}`) as string;
		const storedPrivateKey = UserPreferences.getString(`${SERVER}-${E2E_PRIVATE_KEY}`) as string;
		const decodedPrivateKey = await Encryption.decodePrivateKey(private_key, randomPassword, user.userId);

		expect(JSON.parse(decodedPrivateKey)).toEqual(JSON.parse(storedPrivateKey));
		expect(JSON.parse(public_key).n).toBe(JSON.parse(storedPrivateKey).n);
		expect(EJSON.parse(UserPreferences.getString(`${SERVER}-${E2E_PUBLIC_KEY}`) as string)).toEqual(JSON.parse(public_key));
	});

	it('asks the server for the keys of every encrypted room', async () => {
		await Encryption.createKeys(user.userId, SERVER);

		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('e2e.requestSubscriptionKeys');
	});
});

describe('changePassword', () => {
	it('sends the stored public key and the private key encoded with the new password', async () => {
		await signIn();

		await Encryption.changePassword(SERVER, NEW_PASSWORD);

		const { public_key, private_key } = sentKeys();
		const decodedPrivateKey = await Encryption.decodePrivateKey(private_key, NEW_PASSWORD, user.userId);
		expect(JSON.parse(decodedPrivateKey)).toEqual(JSON.parse(user.privateKey));
		expect(EJSON.parse(public_key)).toEqual(JSON.parse(user.publicKey));
	});

	it('sends force on a 6.10.0 server so it replaces the existing keys', async () => {
		await signIn();
		mockState.server.version = '6.10.0';

		await Encryption.changePassword(SERVER, NEW_PASSWORD);

		expect(sentKeys().force).toBe(true);
	});

	it('omits force on a 6.9.0 server', async () => {
		await signIn();
		mockState.server.version = '6.9.0';

		await Encryption.changePassword(SERVER, NEW_PASSWORD);

		expect(sentKeys()).not.toHaveProperty('force');
	});

	it('refuses and sends nothing when the public key is not stored', async () => {
		await signIn();
		UserPreferences.removeItem(`${SERVER}-${E2E_PUBLIC_KEY}`);

		await expect(Encryption.changePassword(SERVER, NEW_PASSWORD)).rejects.toThrow('Public key not found');
		expect(sdk.post).not.toHaveBeenCalled();
	});
});
