import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { waitFor } from '@testing-library/react-native';

import Encryption from '../encryption';
import { MAX_CONCURRENT_QUEUE } from '../constants';
import { type TAppDatabase } from '../../database/interfaces';
import { type ILastMessage, type IMessage, type IServerAttachment, type ISubscription } from '~/definitions';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';
import file from './fixtures/file.json';
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

jest.mock('../../services/restApi', () => ({
	...jest.requireActual('../../services/restApi'),
	fetchUsersWaitingForGroupKey: jest.fn(() => Promise.resolve({ success: true, usersWaitingForE2EKeys: {} }))
}));

jest.mock('expo-file-system/legacy', () => ({
	deleteAsync: (fileUri: string) => require('node:fs/promises').rm(require('node:url').fileURLToPath(fileUri))
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.13.0' }, settings: {}, encryption: { enabled: true, banner: '' } }) }
}));

const SERVER = 'https://open.rocket.chat';
const V1_ROOM_ID = 'v1-room';
const V2_ROOM_ID = 'v2-room';
const KEYLESS_ROOM_ID = 'keyless-room';
const PENDING_LAST_MESSAGE = { _id: 'last-message', t: 'e2e', e2e: 'pending', content: messages.v2 } as unknown as ILastMessage;

const plaintextFile = Buffer.from(file.plaintext, 'base64');

const pendingMessage = (rid: string, content: IMessage['content']) =>
	({ _id: `${rid}-message`, rid, t: 'e2e', e2e: 'pending', content }) as unknown as IMessage;

const seedRoom = (rid: string, roomKey: typeof roomKeys.v1, lastMessage?: ILastMessage) =>
	mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: rid }, subscriptions.schema);
			subscription.rid = rid;
			subscription.encrypted = true;
			subscription.E2EKey = roomKey.E2EKey;
			subscription.e2eKeyId = roomKey.keyID;
			subscription.lastMessage = lastMessage;
		});
	});

const seedPendingRows = () =>
	mockDatabase.write(async () => {
		const pendingRow = (table: string, extra: object = {}) => {
			const collection = mockDatabase.get(table as 'messages');
			return collection.prepareCreateFromDirtyRaw({
				id: `${table}-row`,
				rid: V2_ROOM_ID,
				t: 'e2e',
				e2e: 'pending',
				msg: '',
				content: JSON.stringify(messages.v2),
				...extra
			});
		};
		await mockDatabase.batch([
			pendingRow('messages'),
			pendingRow('threads'),
			pendingRow('thread_messages', { subscription_id: V2_ROOM_ID })
		]);
	});

const signIn = async () => {
	await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
};

let tempDirectory: string;

const writeEncryptedFile = async () => {
	const path = join(await mkdtemp(join(tempDirectory, 'file-')), 'encrypted');
	await writeFile(path, Buffer.from(file.encrypted, 'base64'));
	return pathToFileURL(path).href;
};

beforeAll(async () => {
	tempDirectory = await mkdtemp(join(tmpdir(), 'e2ee-decryption-'));
});

afterAll(() => rm(tempDirectory, { recursive: true, force: true }));

beforeEach(async () => {
	mockDatabase = createInMemoryAppDatabase();
	await seedRoom(V1_ROOM_ID, roomKeys.v1);
	await seedRoom(V2_ROOM_ID, roomKeys.v2, PENDING_LAST_MESSAGE);
});

afterEach(() => {
	Encryption.stop();
});

describe('decrypting what is stored on initialize', () => {
	it('decrypts pending messages, threads and thread messages of encrypted rooms', async () => {
		await seedPendingRows();

		await signIn();

		await waitFor(async () => {
			const rows = await Promise.all(
				(['messages', 'threads', 'thread_messages'] as const).map(table => mockDatabase.get(table).find(`${table}-row`))
			);
			expect(rows.map(({ msg, e2e }) => ({ msg, e2e }))).toEqual(Array(3).fill({ msg: messages.plaintext.msg, e2e: 'done' }));
		});
	});

	it('decrypts the last message of encrypted rooms', async () => {
		await signIn();

		await waitFor(async () => {
			const { lastMessage } = await mockDatabase.get('subscriptions').find(V2_ROOM_ID);
			expect(lastMessage).toEqual(expect.objectContaining({ msg: messages.plaintext.msg, e2e: 'done' }));
		});
	});
});

describe('decryptMessages', () => {
	it("decrypts each message with its room's key and passes the rest through", async () => {
		const plainMessage = { _id: 'plain', rid: V2_ROOM_ID, msg: 'not encrypted' } as IMessage;
		const keylessRoomMessage = pendingMessage(KEYLESS_ROOM_ID, messages.v2 as IMessage['content']);
		await signIn();

		const decrypted = await Encryption.decryptMessages([
			pendingMessage(V1_ROOM_ID, messages.v1 as IMessage['content']),
			pendingMessage(V2_ROOM_ID, messages.v2 as IMessage['content']),
			plainMessage,
			keylessRoomMessage
		]);

		expect(decrypted.map(({ msg }) => msg)).toEqual([messages.plaintext.msg, messages.plaintext.msg, 'not encrypted', undefined]);
		expect(decrypted[3]).toEqual(keylessRoomMessage);
	});
});

describe('decryptSubscriptions', () => {
	const subscription = { rid: V2_ROOM_ID, lastMessage: PENDING_LAST_MESSAGE } as unknown as ISubscription;

	it('returns subscriptions untouched until the client is ready', async () => {
		await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
		const subscriptions = [subscription];

		expect(await Encryption.decryptSubscriptions(subscriptions)).toBe(subscriptions);
	});

	it('decrypts the last message once the client is ready', async () => {
		await signIn();

		const [decrypted] = await Encryption.decryptSubscriptions([subscription]);

		expect(decrypted?.lastMessage).toEqual(expect.objectContaining({ msg: messages.plaintext.msg, e2e: 'done' }));
	});
});

describe('decryptFiles', () => {
	it('decrypts the description of encrypted files', async () => {
		const encryptedFile = { _id: 'encrypted', rid: V2_ROOM_ID, content: messages.v2 } as unknown as IServerAttachment;
		await signIn();

		const [decrypted] = await Encryption.decryptFiles([encryptedFile]);

		expect(decrypted).toEqual(expect.objectContaining({ msg: messages.plaintext.msg }));
	});
});

describe('decrypt file queue', () => {
	const encryption = { key: file.key, iv: file.iv };

	it('decrypts every queued file, more than the queue runs at once', async () => {
		const paths = await Promise.all(Array.from({ length: 7 }, writeEncryptedFile));

		const decryptedPaths = await Promise.all(
			paths.map(path => Encryption.addFileToDecryptFileQueue('message-id', path, encryption, file.hash))
		);

		const contents = await Promise.all(decryptedPaths.map(path => readFile(fileURLToPath(path as string))));
		expect(contents).toEqual(Array(7).fill(plaintextFile));
	});

	it('rejects files that fail to decrypt and still decrypts the files queued behind them', async () => {
		const missingPaths = Array.from(
			{ length: MAX_CONCURRENT_QUEUE },
			(_, index) => pathToFileURL(join(tempDirectory, `missing-${index}`)).href
		);
		const paths = await Promise.all(Array.from({ length: 2 }, writeEncryptedFile));

		const results = await Promise.allSettled(
			[...missingPaths, ...paths].map(path => Encryption.addFileToDecryptFileQueue('message-id', path, encryption, file.hash))
		);

		const missing = results.slice(0, MAX_CONCURRENT_QUEUE);
		const decrypted = results.slice(MAX_CONCURRENT_QUEUE) as PromiseFulfilledResult<string>[];
		expect(missing.map(({ status }) => status)).toEqual(Array(MAX_CONCURRENT_QUEUE).fill('rejected'));
		const contents = await Promise.all(decrypted.map(({ value }) => readFile(fileURLToPath(value))));
		expect(contents).toEqual([plaintextFile, plaintextFile]);
	});
});
