import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { waitFor } from '@testing-library/react-native';

import Encryption from '../encryption';
import {
	e2eGetUsersOfRoomWithoutKey,
	fetchUsersWaitingForGroupKey,
	provideUsersSuggestedGroupKeys
} from '../../services/restApi';
import { E2E_BANNER_TYPE } from '../../constants/keys';
import { type TAppDatabase } from '../../database/interfaces';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';
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

jest.mock('../../services/restApi', () => ({
	...jest.requireActual('../../services/restApi'),
	fetchUsersWaitingForGroupKey: jest.fn(),
	provideUsersSuggestedGroupKeys: jest.fn(),
	e2eGetUsersOfRoomWithoutKey: jest.fn(),
	e2eRequestRoomKey: jest.fn()
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
const WAITING_USER_ID = 'waiting-user';

const { subtle } = globalThis.crypto;

const flushPromises = async () => {
	for (let i = 0; i < 10; i += 1) {
		await new Promise(resolve => setImmediate(resolve));
	}
};

const seedRoom = (rid: string, { withRoomKey = true, waitingUserId = WAITING_USER_ID } = {}) =>
	mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: rid }, subscriptions.schema);
			subscription.rid = rid;
			subscription.encrypted = true;
			subscription.E2EKey = withRoomKey ? roomKeys.v2.E2EKey : undefined;
			subscription.e2eKeyId = roomKeys.v2.keyID;
			subscription.usersWaitingForE2EKeys = [{ userId: waitingUserId, ts: new Date() }];
		});
	});

const loadKeys = () => Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);

const signIn = async () => {
	await loadKeys();
	Encryption.initialize(user.userId);
};

let waitingUserKeys: CryptoKeyPair;
let waitingUserPublicKey: string;

const webClientDecryptGroupKey = async (groupKey: string) => {
	const decrypted = await subtle.decrypt(
		{ name: 'RSA-OAEP' },
		waitingUserKeys.privateKey,
		Buffer.from(groupKey.slice(-344), 'base64')
	);
	return { keyID: groupKey.slice(0, -344), sessionKey: JSON.parse(Buffer.from(decrypted).toString('latin1')) };
};

type TGroupKeys = Record<string, { _id: string; key: string }[]>;

const sentGroupKeys = () => {
	expect(provideUsersSuggestedGroupKeys).toHaveBeenCalledTimes(1);
	return jest.mocked(provideUsersSuggestedGroupKeys).mock.calls[0][0] as TGroupKeys;
};

const expectRoomKeyForWaitingUser = async (groupKeys: TGroupKeys) => {
	expect(Object.keys(groupKeys)).toEqual([ROOM_ID]);
	expect(groupKeys[ROOM_ID].map(({ _id }) => _id)).toEqual([WAITING_USER_ID]);
	await expect(webClientDecryptGroupKey(groupKeys[ROOM_ID][0].key)).resolves.toEqual({
		keyID: roomKeys.v2.keyID,
		sessionKey: JSON.parse(roomKeys.v2.sessionKeyExportedString)
	});
};

beforeAll(async () => {
	waitingUserKeys = await subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt']
	);
	waitingUserPublicKey = JSON.stringify(await subtle.exportKey('jwk', waitingUserKeys.publicKey));
});

beforeEach(() => {
	jest.clearAllMocks();
	mockState.encryption = { enabled: true, banner: '' };
	mockDatabase = createInMemoryAppDatabase();
	jest.mocked(fetchUsersWaitingForGroupKey).mockResolvedValue({ success: true, usersWaitingForE2EKeys: {} } as any);
});

afterEach(async () => {
	Object.values(Encryption.roomInstances).forEach(room => (room.requestRoomKey as unknown as { stop: () => void }).stop());
	Encryption.stop();
	await flushPromises();
});

describe('key distribution across sign-ins', () => {
	beforeEach(() => seedRoom(ROOM_ID));

	it('distributes room keys right away when the user signs in again after a stop', async () => {
		await signIn();
		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(1));

		Encryption.stop();
		await signIn();

		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(2));
	});

	it('distributes right away on the next sign in when the client stopped during the first distribution', async () => {
		jest.mocked(fetchUsersWaitingForGroupKey).mockImplementationOnce(async () => {
			Encryption.stop();
			return { success: true, usersWaitingForE2EKeys: {} } as any;
		});
		await signIn();
		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(1));
		await flushPromises();

		await signIn();

		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(2));
	});
});

describe('key distribution', () => {
	it('gives each user waiting in a room the room key, encrypted with their public key', async () => {
		await seedRoom(ROOM_ID);
		jest.mocked(fetchUsersWaitingForGroupKey).mockResolvedValue({
			success: true,
			usersWaitingForE2EKeys: { [ROOM_ID]: [{ _id: WAITING_USER_ID, public_key: waitingUserPublicKey }] }
		} as any);

		await signIn();

		await waitFor(() => expect(provideUsersSuggestedGroupKeys).toHaveBeenCalled());
		await expectRoomKeyForWaitingUser(sentGroupKeys());
	});

	it('skips rooms where the current user is the one waiting for the key', async () => {
		await seedRoom(ROOM_ID);
		await seedRoom('own-wait-room', { waitingUserId: user.userId });

		await signIn();

		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledWith([ROOM_ID]));
	});

	it('asks only about rooms whose key the client holds', async () => {
		await seedRoom(ROOM_ID);
		await seedRoom('keyless-room', { withRoomKey: false });

		await signIn();

		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledWith([ROOM_ID]));
	});

	it('samples at most 10 rooms', async () => {
		const roomIds = Array.from({ length: 12 }, (_, index) => `room-${index}`);
		for (const roomId of roomIds) {
			await seedRoom(roomId);
		}
		await loadKeys();

		const sample = await Encryption.getSample(roomIds);

		expect(sample).toHaveLength(10);
		expect(new Set(sample).size).toBe(10);
	});
});

describe('provideRoomKeyToUser', () => {
	beforeEach(async () => {
		await seedRoom(ROOM_ID);
		jest.mocked(e2eGetUsersOfRoomWithoutKey).mockResolvedValue({
			success: true,
			users: [{ _id: WAITING_USER_ID, e2e: { public_key: waitingUserPublicKey } }]
		} as any);
	});

	it('waits for the client to be ready, then shares the room key with members missing it', async () => {
		const providing = Encryption.provideRoomKeyToUser(roomKeys.v2.keyID, ROOM_ID);
		await flushPromises();

		await signIn();
		await providing;

		await expectRoomKeyForWaitingUser(sentGroupKeys());
	});

	it('shares nothing while the user has not entered the E2E password', async () => {
		mockState.encryption = { enabled: true, banner: E2E_BANNER_TYPE.REQUEST_PASSWORD };
		await loadKeys();

		await Encryption.provideRoomKeyToUser(roomKeys.v2.keyID, ROOM_ID);

		expect(provideUsersSuggestedGroupKeys).not.toHaveBeenCalled();
	});
});
