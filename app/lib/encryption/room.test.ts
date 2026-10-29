import { createDecipheriv, createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import EJSON from 'ejson';
import { sha256 } from 'js-sha256';
import { rsaEncrypt, rsaImportKey } from '@rocket.chat/mobile-crypto';

import EncryptionRoom from './room';
import { bufferToB64, joinVectorData } from './utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../constants/keys';
import { type IEncryption } from './definitions';
import { type IMessage } from '~/definitions';
import getSingleMessage from '../methods/getSingleMessage';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getMessageById } from '../database/services/Message';
import { createQuoteAttachment } from './helpers/createQuoteAttachment';
import {
	e2eRejectSuggestedGroupKey,
	e2eAcceptSuggestedGroupKey,
	e2eSetRoomKeyID,
	e2eRequestRoomKey,
	e2eGetUsersOfRoomWithoutKey,
	provideUsersSuggestedGroupKeys,
	e2eUpdateGroupKey
} from '../services/restApi';
import user from './__tests__/fixtures/user.json';
import roomKeys from './__tests__/fixtures/roomKeys.json';
import messages from './__tests__/fixtures/messages.json';
import fileFixture from './__tests__/fixtures/file.json';

jest.mock('../methods/getSingleMessage', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../services/restApi', () => ({
	e2eRejectSuggestedGroupKey: jest.fn(),
	e2eAcceptSuggestedGroupKey: jest.fn(),
	e2eSetRoomKeyID: jest.fn(),
	e2eRequestRoomKey: jest.fn(),
	e2eGetUsersOfRoomWithoutKey: jest.fn(),
	provideUsersSuggestedGroupKeys: jest.fn(),
	e2eUpdateGroupKey: jest.fn()
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('./helpers/createQuoteAttachment', () => ({
	createQuoteAttachment: jest.fn()
}));

const mockGetState = jest.fn();
jest.mock('../store/auxStore', () => ({
	store: { getState: () => mockGetState() }
}));

const mockGetSingleMessage = getSingleMessage as jest.Mock;
const mockGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.Mock;
const mockGetMessageById = getMessageById as jest.Mock;
const mockCreateQuoteAttachment = createQuoteAttachment as jest.Mock;

const mockE2eRejectSuggestedGroupKey = e2eRejectSuggestedGroupKey as jest.Mock;
const mockE2eAcceptSuggestedGroupKey = e2eAcceptSuggestedGroupKey as jest.Mock;
const mockE2eSetRoomKeyID = e2eSetRoomKeyID as jest.Mock;
const mockE2eRequestRoomKey = e2eRequestRoomKey as jest.Mock;
const mockE2eGetUsersOfRoomWithoutKey = e2eGetUsersOfRoomWithoutKey as jest.Mock;
const mockProvideUsersSuggestedGroupKeys = provideUsersSuggestedGroupKeys as jest.Mock;
const mockE2eUpdateGroupKey = e2eUpdateGroupKey as jest.Mock;

type TRoomKeyVersion = keyof typeof roomKeys;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNDECRYPTABLE_E2E_KEY = `${roomKeys.v2.keyID}${bufferToB64(new Uint8Array(256).fill(7).buffer)}`;
const encryptedMessages = { v1: messages.v1 as IMessage['content'], v2: messages.v2 as IMessage['content'] };

let privateKey: string;
let publicKey: string;

beforeAll(async () => {
	privateKey = await rsaImportKey(JSON.parse(user.privateKey));
	publicKey = await rsaImportKey(JSON.parse(user.publicKey));
});

const createEncryption = (overrides: Partial<IEncryption> = {}): IEncryption => ({
	privateKey,
	publicKey: user.publicKey,
	deleteRoomInstance: jest.fn(),
	...overrides
});

const createRoom = (encryptionOverrides: Partial<IEncryption> = {}) =>
	new EncryptionRoom('room1', 'user1', createEncryption(encryptionOverrides));

const createReadyRoom = async (version: TRoomKeyVersion = 'v2', subscription: object = {}) => {
	mockGetSubscriptionByRoomId.mockResolvedValue({
		encrypted: true,
		E2EKey: roomKeys[version].E2EKey,
		e2eKeyId: roomKeys[version].keyID,
		...subscription
	});
	const room = createRoom();
	await room.handshake();
	await room.readyPromise;
	return room;
};

const sessionKeyOf = (E2EKey: string | undefined) => createRoom().importRoomKey(E2EKey!, privateKey);

const sessionKeyBytes = (sessionKeyExportedString: string) =>
	new Uint8Array(Buffer.from(JSON.parse(sessionKeyExportedString).k, 'base64url')).buffer;

beforeEach(() => {
	jest.clearAllMocks();
	mockGetState.mockReturnValue({ server: { version: '7.13.0' }, settings: {} });
});

describe('EncryptionRoom constructor', () => {
	it('starts not ready, not establishing, with empty key material', () => {
		const room = createRoom();
		expect(room.ready).toBe(false);
		expect(room.establishing).toBe(false);
		expect(room.keyID).toBe('');
		expect(room.algorithm).toBe('');
		expect(room.sessionKeyExportedString).toBe('');
		expect(room.roomKey.byteLength).toBe(0);
		expect(room.subscription).toBeNull();
	});
});

describe('importRoomKey', () => {
	it('rejects any failure (malformed input, bad decrypt, invalid EJSON)', async () => {
		const room = createRoom();
		const notEjson = await rsaEncrypt('not-valid-ejson', publicKey);

		await expect(room.importRoomKey('too-short', privateKey)).rejects.toThrow();
		await expect(room.importRoomKey(UNDECRYPTABLE_E2E_KEY, privateKey)).rejects.toThrow();
		await expect(room.importRoomKey(`kid123${notEjson}`, privateKey)).rejects.toThrow();
	});
});

describe('hasSessionKey', () => {
	it('reflects whether a session key string has been set', () => {
		const room = createRoom();
		expect(room.hasSessionKey()).toBe(false);
		room.sessionKeyExportedString = 'something';
		expect(room.hasSessionKey()).toBe(true);
	});
});

describe('createNewRoomKey', () => {
	const createKeyOn = async (version: string) => {
		mockGetState.mockReturnValue({ server: { version }, settings: {} });
		const room = createRoom();
		await room.createNewRoomKey();
		return room;
	};

	it('creates an A256GCM key with a random UUID keyID for servers >= 7.13.0', async () => {
		const room = await createKeyOn('7.13.0');

		expect(room.algorithm).toBe('A256GCM');
		expect(room.roomKey.byteLength).toBe(32);
		expect(room.keyID).toMatch(UUID);
		const parsed = EJSON.parse(room.sessionKeyExportedString);
		expect(parsed).toMatchObject({ kty: 'oct', alg: 'A256GCM', ext: true, key_ops: ['encrypt', 'decrypt'] });
		expect(Buffer.from(sessionKeyBytes(room.sessionKeyExportedString))).toEqual(Buffer.from(room.roomKey));
	});

	it('creates an A128CBC key with a sha256-derived keyID for 7.0.0 <= servers < 7.13.0', async () => {
		const room = await createKeyOn('7.5.0');

		expect(room.algorithm).toBe('A128CBC');
		expect(room.roomKey.byteLength).toBe(16);
		expect(room.keyID).toBe(sha256(room.sessionKeyExportedString).slice(0, 12));
		const parsed = EJSON.parse(room.sessionKeyExportedString);
		expect(parsed).toMatchObject({ kty: 'oct', alg: 'A128CBC', ext: true, key_ops: ['encrypt', 'decrypt'] });
		expect(Buffer.from(sessionKeyBytes(room.sessionKeyExportedString))).toEqual(Buffer.from(room.roomKey));
	});

	it('creates an A128CBC key with a base64-derived keyID for servers < 7.0.0', async () => {
		const room = await createKeyOn('6.5.0');

		expect(room.algorithm).toBe('A128CBC');
		expect(room.roomKey.byteLength).toBe(16);
		expect(room.keyID).toBe('eyJrdHkiOiJv');
	});
});

describe('createRoomKey', () => {
	it('creates a new room key, persists the keyID, then shares it with participants, in that order', async () => {
		const room = createRoom();
		const order: string[] = [];
		jest.spyOn(room, 'createNewRoomKey').mockImplementation(() => {
			order.push('create');
			room.keyID = 'new-key-id';
			return Promise.resolve();
		});
		mockE2eSetRoomKeyID.mockImplementation(() => {
			order.push('setKeyID');
		});
		jest.spyOn(room, 'encryptKeyForOtherParticipants').mockImplementation(() => {
			order.push('share');
			return Promise.resolve();
		});

		await room.createRoomKey();

		expect(order).toEqual(['create', 'setKeyID', 'share']);
		expect(mockE2eSetRoomKeyID).toHaveBeenCalledWith('room1', 'new-key-id');
	});
});

describe('resetRoomKey', () => {
	it('returns undefined without creating a key when there is no public key', async () => {
		const room = createRoom({ publicKey: null });
		const createNewRoomKeySpy = jest.spyOn(room, 'createNewRoomKey');
		const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

		const result = await room.resetRoomKey();

		expect(result).toBeUndefined();
		expect(createNewRoomKeySpy).not.toHaveBeenCalled();
		consoleLog.mockRestore();
	});

	it('replaces the room key and returns the new key id plus the new key encrypted for the current user', async () => {
		const room = await createReadyRoom('v2');

		const result = await room.resetRoomKey();

		expect(result!.e2eKeyId).toBe(room.keyID);
		expect(result!.e2eKeyId).not.toBe(roomKeys.v2.keyID);
		const imported = await sessionKeyOf(result!.e2eKey);
		expect(imported.keyID).toBe(room.keyID);
		expect(imported.sessionKeyExportedString).toBe(room.sessionKeyExportedString);
		expect(imported.sessionKeyExportedString).not.toBe(roomKeys.v2.sessionKeyExportedString);
	});

	it('rethrows when creating the new key fails', async () => {
		const room = createRoom();
		const error = new Error('boom');
		jest.spyOn(room, 'createNewRoomKey').mockRejectedValue(error);
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

		await expect(room.resetRoomKey()).rejects.toBe(error);
		consoleError.mockRestore();
	});
});

describe('requestRoomKey', () => {
	let room: EncryptionRoom;

	afterEach(() => {
		// Stop the pending debounce timeout so it doesn't leak into other tests / keep the process alive.
		(room.requestRoomKey as unknown as { stop: () => void }).stop();
	});

	it('requests the room key immediately, debouncing rapid repeats into a single call', () => {
		room = createRoom();
		mockE2eRequestRoomKey.mockResolvedValue({ success: true });

		room.requestRoomKey('key-1');
		room.requestRoomKey('key-1');

		expect(mockE2eRequestRoomKey).toHaveBeenCalledTimes(1);
		expect(mockE2eRequestRoomKey).toHaveBeenCalledWith('room1', 'key-1');
	});

	it('swallows request failures instead of throwing', () => {
		room = createRoom();
		mockE2eRequestRoomKey.mockRejectedValue(new Error('network'));

		expect(() => room.requestRoomKey('key-1')).not.toThrow();
	});
});

describe('encryptRoomKeyForUser', () => {
	it.each(['v1', 'v2'] as const)('encrypts the %s session key so the user can import it back', async version => {
		const room = await createReadyRoom(version);

		const result = await room.encryptRoomKeyForUser(user.publicKey);

		const imported = await sessionKeyOf(result);
		expect(imported.keyID).toBe(roomKeys[version].keyID);
		expect(imported.sessionKeyExportedString).toBe(roomKeys[version].sessionKeyExportedString);
	});

	it('logs and returns undefined when the public key cannot be imported', async () => {
		const room = await createReadyRoom('v2');

		const result = await room.encryptRoomKeyForUser(EJSON.stringify({ n: 'pub' }));

		expect(result).toBeUndefined();
	});
});

describe('encryptOldKeysForParticipant', () => {
	it('returns undefined when there are no old room keys', async () => {
		const room = createRoom();
		await expect(room.encryptOldKeysForParticipant(user.publicKey, undefined)).resolves.toBeUndefined();
		await expect(room.encryptOldKeysForParticipant(user.publicKey, [])).resolves.toBeUndefined();
	});

	it('logs and returns undefined when the public key cannot be imported', async () => {
		const room = createRoom();

		const result = await room.encryptOldKeysForParticipant(EJSON.stringify({ n: 'bad-pub' }), [
			{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.sessionKeyExportedString }
		]);

		expect(result).toBeUndefined();
	});

	it('re-encrypts each old key for the user, prefixed with its own keyID, skipping entries without an E2EKey', async () => {
		const room = createRoom();
		const oldKeys = [
			{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.sessionKeyExportedString, ts: 't1' },
			{ e2eKeyId: 'k2', ts: 't2' },
			{ e2eKeyId: roomKeys.v2.keyID, E2EKey: roomKeys.v2.sessionKeyExportedString, ts: 't3' }
		];

		const result = await room.encryptOldKeysForParticipant(user.publicKey, oldKeys);

		expect(result).toEqual([
			{ e2eKeyId: roomKeys.v1.keyID, ts: 't1', E2EKey: expect.any(String) },
			{ e2eKeyId: roomKeys.v2.keyID, ts: 't3', E2EKey: expect.any(String) }
		]);
		const [v1, v2] = await Promise.all(result!.map(key => sessionKeyOf(key.E2EKey)));
		expect(v1).toMatchObject({ keyID: roomKeys.v1.keyID, sessionKeyExportedString: roomKeys.v1.sessionKeyExportedString });
		expect(v2).toMatchObject({ keyID: roomKeys.v2.keyID, sessionKeyExportedString: roomKeys.v2.sessionKeyExportedString });
	});
});

describe('exportOldRoomKeys', () => {
	it('returns [] when there are no old keys', async () => {
		const room = createRoom();
		await expect(room.exportOldRoomKeys(undefined)).resolves.toEqual([]);
		await expect(room.exportOldRoomKeys([])).resolves.toEqual([]);
	});

	it('decrypts each old key into its session key, skipping keys without an E2EKey and keys that fail to decrypt', async () => {
		const room = createRoom();

		const result = await room.exportOldRoomKeys([
			{ e2eKeyId: 'k1' },
			{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.E2EKey, ts: 't2' },
			{ e2eKeyId: 'k3', E2EKey: UNDECRYPTABLE_E2E_KEY }
		]);

		expect(result).toEqual([{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.sessionKeyExportedString, ts: 't2' }]);
	});

	it('skips every key when there is no private key available', async () => {
		const room = createRoom({ privateKey: null });

		const result = await room.exportOldRoomKeys([{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.E2EKey }]);

		expect(result).toEqual([]);
	});
});

describe('encryptKeyForOtherParticipants', () => {
	it('does nothing when there are no users missing a key', async () => {
		const room = createRoom();
		mockE2eGetUsersOfRoomWithoutKey.mockResolvedValue({ success: true, users: [] });

		await room.encryptKeyForOtherParticipants();

		expect(mockProvideUsersSuggestedGroupKeys).not.toHaveBeenCalled();
		expect(mockE2eUpdateGroupKey).not.toHaveBeenCalled();
	});

	it('does nothing when the lookup is unsuccessful', async () => {
		const room = createRoom();
		mockE2eGetUsersOfRoomWithoutKey.mockResolvedValue({ success: false });

		await room.encryptKeyForOtherParticipants();

		expect(mockProvideUsersSuggestedGroupKeys).not.toHaveBeenCalled();
	});

	it('does not throw when the lookup itself rejects', async () => {
		const room = createRoom();
		mockE2eGetUsersOfRoomWithoutKey.mockRejectedValue(new Error('network'));

		await expect(room.encryptKeyForOtherParticipants()).resolves.toBeUndefined();
	});

	it('batches suggested group keys for servers >= 7.0.0, attaching re-encrypted old keys', async () => {
		const room = await createReadyRoom('v2', {
			oldRoomKeys: [{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.E2EKey, ts: 't' }]
		});
		mockE2eGetUsersOfRoomWithoutKey.mockResolvedValue({
			success: true,
			users: [
				{ _id: 'u1', e2e: { public_key: user.publicKey } },
				{ _id: 'u2', e2e: { public_key: user.publicKey } }
			]
		});

		await room.encryptKeyForOtherParticipants();

		expect(mockE2eUpdateGroupKey).not.toHaveBeenCalled();
		expect(mockProvideUsersSuggestedGroupKeys).toHaveBeenCalledTimes(1);
		const { room1: suggestions } = mockProvideUsersSuggestedGroupKeys.mock.calls[0][0];
		expect(suggestions.map(({ _id }: { _id: string }) => _id)).toEqual(['u1', 'u2']);
		for await (const suggestion of suggestions) {
			expect((await sessionKeyOf(suggestion.key)).sessionKeyExportedString).toBe(roomKeys.v2.sessionKeyExportedString);
			expect(suggestion.oldKeys).toEqual([{ e2eKeyId: roomKeys.v1.keyID, E2EKey: expect.any(String), ts: 't' }]);
			const oldKey = await sessionKeyOf(suggestion.oldKeys[0].E2EKey);
			expect(oldKey).toMatchObject({ keyID: roomKeys.v1.keyID, sessionKeyExportedString: roomKeys.v1.sessionKeyExportedString });
		}
	});

	it('updates each user individually for servers < 7.0.0, skipping users without a public key', async () => {
		const room = await createReadyRoom('v1');
		mockGetState.mockReturnValue({ server: { version: '6.9.0' }, settings: {} });
		mockE2eGetUsersOfRoomWithoutKey.mockResolvedValue({
			success: true,
			users: [{ _id: 'u1', e2e: { public_key: user.publicKey } }, { _id: 'u2' }]
		});

		await room.encryptKeyForOtherParticipants();

		expect(mockProvideUsersSuggestedGroupKeys).not.toHaveBeenCalled();
		expect(mockE2eUpdateGroupKey).toHaveBeenCalledTimes(1);
		expect(mockE2eUpdateGroupKey).toHaveBeenCalledWith('u1', 'room1', expect.any(String));
		const imported = await sessionKeyOf(mockE2eUpdateGroupKey.mock.calls[0][2]);
		expect(imported.sessionKeyExportedString).toBe(roomKeys.v1.sessionKeyExportedString);
	});
});

describe('provideKeyToUser', () => {
	it('shares the room key when the requested keyId matches the current one', async () => {
		const room = createRoom();
		room.keyID = 'current';
		const spy = jest.spyOn(room, 'encryptKeyForOtherParticipants').mockResolvedValue(undefined);

		await room.provideKeyToUser('current');

		expect(spy).toHaveBeenCalled();
	});

	it('ignores requests carrying a stale keyId', async () => {
		const room = createRoom();
		room.keyID = 'current';
		const spy = jest.spyOn(room, 'encryptKeyForOtherParticipants').mockResolvedValue(undefined);

		await room.provideKeyToUser('stale');

		expect(spy).not.toHaveBeenCalled();
	});
});

describe('encryptGroupKeyForParticipantsWaitingForTheKeys', () => {
	it('returns undefined when the room is not ready', async () => {
		const room = createRoom();

		const result = await room.encryptGroupKeyForParticipantsWaitingForTheKeys([{ _id: 'u1', public_key: user.publicKey }]);

		expect(result).toBeUndefined();
	});

	it('encrypts the room key and old keys for each waiting user', async () => {
		const room = await createReadyRoom('v2', { oldRoomKeys: [{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.E2EKey }] });

		const result = await room.encryptGroupKeyForParticipantsWaitingForTheKeys([
			{ _id: 'u1', public_key: user.publicKey },
			{ _id: 'u2', public_key: user.publicKey }
		]);

		expect(result!.map(({ _id }) => _id)).toEqual(['u1', 'u2']);
		for await (const waitingUser of result!) {
			expect((await sessionKeyOf(waitingUser.key)).sessionKeyExportedString).toBe(roomKeys.v2.sessionKeyExportedString);
			expect(waitingUser.oldKeys).toHaveLength(1);
			const oldKey = await sessionKeyOf(waitingUser.oldKeys![0].E2EKey);
			expect(oldKey).toMatchObject({ keyID: roomKeys.v1.keyID, sessionKeyExportedString: roomKeys.v1.sessionKeyExportedString });
		}
	});
});

describe('encryptText', () => {
	const plaintext = EJSON.stringify({ msg: 'Olá 🔐' });

	it('uses a fresh IV for every encryption', async () => {
		const room = await createReadyRoom('v2');

		const first = await room.encryptText(plaintext);
		const second = await room.encryptText(plaintext);

		expect((second as { iv: string }).iv).not.toBe((first as { iv: string }).iv);
		expect(second.ciphertext).not.toBe(first.ciphertext);
	});
});

describe('encrypt', () => {
	it('returns the message unchanged when the room is not ready', async () => {
		const room = createRoom();
		const message = { _id: 'm1', rid: 'r1', msg: 'hi' } as any;

		const result = await room.encrypt(message);

		expect(result).toBe(message);
	});

	it('returns the original message when encryption throws', async () => {
		const room = createRoom();
		(room as any).ready = true;
		jest.spyOn(room, 'encryptText').mockRejectedValue(new Error('boom'));
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
		const message = { _id: 'm1', rid: 'r1', msg: 'hi' } as any;

		const result = await room.encrypt(message);

		expect(result).toBe(message);
		consoleError.mockRestore();
	});
});

describe('encryptFile', () => {
	const fileBytes = Buffer.from(fileFixture.plaintext, 'base64');
	let directory: string;
	let baseFile: any;

	beforeAll(async () => {
		directory = await mkdtemp(join(tmpdir(), 'encryption-room-'));
		await writeFile(join(directory, 'a.png'), fileBytes);
		await writeFile(join(directory, 'report.pdf'), fileBytes);
		baseFile = {
			path: `file://${join(directory, 'a.png')}`,
			name: 'a.png',
			size: 1234,
			type: 'image/png',
			width: 100,
			height: 200
		};
	});

	afterAll(() => rm(directory, { recursive: true, force: true }));

	const decryptFile = async (path: string, key: { k: string }, iv: string) => {
		const decipher = createDecipheriv('aes-256-ctr', Buffer.from(key.k, 'base64url'), Buffer.from(iv, 'base64'));
		const encrypted = await readFile(path.replace('file://', ''));
		return Buffer.concat([decipher.update(encrypted), decipher.final()]);
	};

	const getDecryptedContent = async (room: EncryptionRoom, file: any) => {
		const { getContent } = await room.encryptFile('room1', file);
		return room.decryptContent((await getContent!('file-id', 'https://server/file-url')) as IMessage['content']);
	};

	it('writes an AES-CTR encrypted copy that decrypts back with the key, IV and checksum carried in the encrypted fileContent', async () => {
		const room = await createReadyRoom('v2');

		const result = await room.encryptFile('room1', baseFile);

		expect(result.file.path).not.toBe(baseFile.path);
		expect(result.file.type).toBe('file');
		expect(result.file.name).toBe(sha256('a.png'));
		const fileContent = await room.decryptContent(result.fileContent as IMessage['content']);
		expect(fileContent).toMatchObject({ type: 'image/png', typeGroup: 'image', name: 'a.png' });
		expect(fileContent.encryption.key).toMatchObject({ kty: 'oct', alg: 'A256CTR', ext: true, key_ops: ['encrypt', 'decrypt'] });
		expect(Buffer.from(fileContent.encryption.key.k, 'base64url')).toHaveLength(32);
		expect(Buffer.from(fileContent.encryption.iv, 'base64')).toHaveLength(16);
		expect(fileContent.hashes.sha256).toBe(createHash('sha256').update(fileBytes).digest('hex'));
		const encrypted = await readFile(result.file.path.replace('file://', ''));
		expect(encrypted.equals(fileBytes)).toBe(false);
		expect(await decryptFile(result.file.path, fileContent.encryption.key, fileContent.encryption.iv)).toEqual(fileBytes);
	});

	it('builds an image attachment via getContent for image files, carrying the same file key as fileContent', async () => {
		const room = await createReadyRoom('v2');

		const { getContent, fileContent } = await room.encryptFile('room1', baseFile);
		const content = await room.decryptContent((await getContent!('file-id', 'https://server/file-url')) as IMessage['content']);

		expect(content.attachments[0]).toMatchObject({
			title: 'a.png',
			type: 'file',
			title_link: 'https://server/file-url',
			title_link_download: true,
			image_url: 'https://server/file-url',
			image_type: 'image/png',
			image_size: 1234,
			image_dimensions: { width: 100, height: 200 }
		});
		const { encryption, hashes } = await room.decryptContent(fileContent as IMessage['content']);
		expect(content.attachments[0].encryption).toEqual(encryption);
		expect(content.attachments[0].hashes).toEqual(hashes);
		expect(content.files[0]).toEqual({ _id: 'file-id', name: 'a.png', type: 'image/png', size: 1234 });
		expect(content.file).toEqual(content.files[0]);
	});

	it('embeds the file caption in the encrypted getContent payload when one is provided', async () => {
		const room = await createReadyRoom('v2');

		const content = await getDecryptedContent(room, { ...baseFile, msg: 'check this out' });

		expect(content.msg).toBe('check this out');
	});

	it('embeds an empty string as msg in the encrypted getContent payload when there is no caption', async () => {
		const room = await createReadyRoom('v2');

		const content = await getDecryptedContent(room, baseFile);

		expect(content.msg).toBe('');
	});

	it('builds an audio attachment via getContent for audio files', async () => {
		const room = await createReadyRoom('v2');

		const content = await getDecryptedContent(room, { ...baseFile, type: 'audio/mp4', width: undefined, height: undefined });

		expect(content.attachments[0]).toMatchObject({
			audio_url: 'https://server/file-url',
			audio_type: 'audio/mp4',
			audio_size: 1234
		});
	});

	it('builds a video attachment via getContent for video files', async () => {
		const room = await createReadyRoom('v2');

		const content = await getDecryptedContent(room, { ...baseFile, type: 'video/mp4', width: undefined, height: undefined });

		expect(content.attachments[0]).toMatchObject({
			video_url: 'https://server/file-url',
			video_type: 'video/mp4',
			video_size: 1234
		});
	});

	it('builds a generic file attachment with an uppercased extension for other file types', async () => {
		const room = await createReadyRoom('v1');

		const content = await getDecryptedContent(room, {
			...baseFile,
			type: 'application/pdf',
			name: 'report.pdf',
			path: `file://${join(directory, 'report.pdf')}`,
			width: undefined,
			height: undefined
		});

		expect(content.attachments[0]).toMatchObject({ size: 1234, format: 'PDF' });
		expect(content.attachments[0].hashes).toEqual({ sha256: createHash('sha256').update(fileBytes).digest('hex') });
	});
});

describe('parse', () => {
	it('parses v2 payloads (algorithm rc.v2.aes-sha2) directly', () => {
		const room = createRoom();
		const iv = bufferToB64(new Uint8Array(12).fill(1).buffer);
		const payload = { algorithm: 'rc.v2.aes-sha2', kid: 'kid1', iv, ciphertext: 'ct' } as any;

		const result = room.parse(payload);

		expect(result.kid).toBe('kid1');
		expect(bufferToB64(result.iv)).toBe(iv);
		expect(result.ciphertext).toBe('ct');
	});

	it('parses v1 string payloads as a 12-char kid followed by base64(iv + ciphertext)', () => {
		const room = createRoom();
		const iv = new Uint8Array(16).fill(2).buffer;
		const data = new Uint8Array([9, 9, 9]).buffer;
		const payload = `abcdefghijkl${bufferToB64(joinVectorData(iv, data))}`;

		const result = room.parse(payload);

		expect(result.kid).toBe('abcdefghijkl');
		expect(bufferToB64(result.iv)).toBe(bufferToB64(iv));
		expect(result.ciphertext).toBe(bufferToB64(data));
	});

	it('parses v1 object payloads that carry the ciphertext string', () => {
		const room = createRoom();
		const iv = new Uint8Array(16).fill(3).buffer;
		const data = new Uint8Array([7, 7]).buffer;
		const message = `abcdefghijkl${bufferToB64(joinVectorData(iv, data))}`;

		const result = room.parse({ ciphertext: message } as any);

		expect(result.kid).toBe('abcdefghijkl');
		expect(result.ciphertext).toBe(bufferToB64(data));
	});
});

describe('doDecrypt', () => {
	it('returns null when AES-GCM authentication fails', async () => {
		const room = createRoom();
		const { iv, ciphertext } = room.parse(encryptedMessages.v2);

		const result = await room.doDecrypt(ciphertext, new Uint8Array(32).buffer, iv, 'A256GCM');

		expect(result).toBeNull();
	});
});

describe('decryptContent', () => {
	it('returns null for empty content', async () => {
		const room = createRoom();
		expect(await room.decryptContent('' as any)).toBeNull();
		expect(await room.decryptContent(null as any)).toBeNull();
	});

	it('falls back to a matching old room key when the kid does not match the current one', async () => {
		const room = await createReadyRoom('v2', { oldRoomKeys: [{ e2eKeyId: roomKeys.v1.keyID, E2EKey: roomKeys.v1.E2EKey }] });

		expect(await room.decryptContent(encryptedMessages.v1)).toEqual(messages.plaintext);
	});

	it('returns null when the kid matches neither the current nor any old room key', async () => {
		const room = await createReadyRoom('v2');

		expect(await room.decryptContent(encryptedMessages.v1)).toBeNull();
	});

	it('returns null when parsing the payload throws', async () => {
		const room = createRoom();
		jest.spyOn(room, 'parse').mockImplementation(() => {
			throw new Error('bad payload');
		});
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

		const result = await room.decryptContent('payload' as any);

		expect(result).toBeNull();
		consoleError.mockRestore();
	});
});

describe('decryptFileContent', () => {
	it.each(['v1', 'v2'] as const)('decrypts and merges %s content into the attachment', async version => {
		const room = await createReadyRoom(version);
		const data = { title: 'file', content: encryptedMessages[version] } as any;

		const result = await room.decryptFileContent(data);

		expect(result).toMatchObject({ title: 'file', msg: messages.plaintext.msg });
	});

	it('returns the attachment unchanged when there is no recognized encryption algorithm', async () => {
		const room = createRoom();
		const spy = jest.spyOn(room, 'decryptContent');
		const data = { content: undefined } as any;

		const result = await room.decryptFileContent(data);

		expect(spy).not.toHaveBeenCalled();
		expect(result).toBe(data);
	});
});

describe('decrypt', () => {
	it('returns the message unchanged when the room is not ready', async () => {
		const room = createRoom();
		const message = { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING } as any;

		expect(await room.decrypt(message)).toBe(message);
	});

	it('returns the message unchanged when it is not an e2e message', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const message = { t: 'normal', msg: 'hi' } as any;

		expect(await room.decrypt(message)).toBe(message);
	});

	it('returns the message unchanged when it is already decrypted', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const message = { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.DONE, msg: 'hi' } as any;

		expect(await room.decrypt(message)).toBe(message);
	});

	it('decrypts a v1 web client ciphertext carried in msg', async () => {
		const room = await createReadyRoom('v1');
		const message = { _id: 'm1', t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, msg: messages.v1.ciphertext } as any;

		const result = await room.decrypt(message);

		expect(result).toMatchObject({ _id: 'm1', msg: messages.plaintext.msg, e2e: 'done' });
	});

	it('uses the decrypted text as msg and marks attachments pending', async () => {
		const room = await createReadyRoom('v2');
		const content = await room.encryptText(EJSON.stringify({ text: 'decrypted text', attachments: [{ title: 'a' }] }));
		const message = { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, msg: 'cipher', content } as any;

		const result = await room.decrypt(message);

		expect(result.msg).toBe('decrypted text');
		expect(result.e2e).toBe('done');
		expect(result.attachments).toEqual([{ title: 'a', e2e: 'pending' }]);
	});

	it('returns the original message unchanged when the content cannot be decrypted', async () => {
		const room = await createReadyRoom('v2');
		const message = { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, content: encryptedMessages.v1 } as any;

		expect(await room.decrypt(message)).toBe(message);
	});
});

describe('decryptQuoteAttachment', () => {
	it('leaves the message unchanged when there are no quotable urls', async () => {
		const room = createRoom();
		const message = { msg: 'just text', attachments: [] } as any;

		const result = await room.decryptQuoteAttachment(message);

		expect(result.attachments).toEqual([]);
		expect(mockGetMessageById).not.toHaveBeenCalled();
	});

	it('drops urls that do not carry a msg query param', async () => {
		const room = createRoom();
		const message = { msg: 'see https://open.rocket.chat/channel/general', attachments: [] } as any;

		const result = await room.decryptQuoteAttachment(message);

		expect(result.attachments).toEqual([]);
	});

	it('builds a quote attachment from the local database when already decrypted there', async () => {
		const room = createRoom();
		const url = 'https://open.rocket.chat/channel/general?msg=quote1';
		const dbRecord = {
			e2e: 'done',
			asPlain: () => ({ _id: 'quote1', msg: 'hi', ts: new Date().toISOString(), _updatedAt: new Date().toISOString() })
		};
		mockGetMessageById.mockResolvedValue(dbRecord);
		mockCreateQuoteAttachment.mockReturnValue({ text: 'hi', message_link: url });
		const message = { msg: `see ${url}`, attachments: [] } as any;

		const result = await room.decryptQuoteAttachment(message);

		expect(mockGetMessageById).toHaveBeenCalledWith('quote1');
		expect(mockGetSingleMessage).not.toHaveBeenCalled();
		expect(result.attachments).toEqual([{ text: 'hi', message_link: url }]);
	});

	it('falls back to the API when the local copy is missing or still encrypted', async () => {
		const room = createRoom();
		const url = 'https://open.rocket.chat/channel/general?msg=quote2';
		mockGetMessageById.mockResolvedValue(null);
		const apiMessage = { _id: 'quote2', msg: 'cipher', ts: '2024-01-01T00:00:00.000Z', _updatedAt: '2024-01-01T00:00:00.000Z' };
		mockGetSingleMessage.mockResolvedValue(apiMessage);
		const decryptSpy = jest.spyOn(room, 'decrypt').mockResolvedValue({ msg: 'plain', u: { username: 'a' } } as any);
		mockCreateQuoteAttachment.mockReturnValue({ text: 'plain', message_link: url });
		const message = { msg: `see ${url}`, attachments: [] } as any;

		const result = await room.decryptQuoteAttachment(message);

		expect(mockGetSingleMessage).toHaveBeenCalledWith('quote2');
		expect(decryptSpy).toHaveBeenCalled();
		expect(result.attachments).toEqual([{ text: 'plain', message_link: url }]);
	});

	it('drops the quote when neither the local database nor the API has the message', async () => {
		const room = createRoom();
		const url = 'https://open.rocket.chat/channel/general?msg=quote3';
		mockGetMessageById.mockResolvedValue(null);
		mockGetSingleMessage.mockResolvedValue(null);
		const message = { msg: `see ${url}`, attachments: [] } as any;

		const result = await room.decryptQuoteAttachment(message);

		expect(result.attachments).toEqual([]);
	});

	it('appends resolved quotes after any pre-existing attachments', async () => {
		const room = createRoom();
		const url = 'https://open.rocket.chat/channel/general?msg=quote4';
		const dbRecord = {
			e2e: 'done',
			asPlain: () => ({ _id: 'quote4', msg: 'hi', ts: new Date().toISOString(), _updatedAt: new Date().toISOString() })
		};
		mockGetMessageById.mockResolvedValue(dbRecord);
		mockCreateQuoteAttachment.mockReturnValue({ text: 'hi', message_link: url });
		const existingAttachment = { title: 'existing' };
		const message = { msg: `see ${url}`, attachments: [existingAttachment] } as any;

		const result = await room.decryptQuoteAttachment(message);

		expect(result.attachments).toEqual([existingAttachment, { text: 'hi', message_link: url }]);
	});
});

describe('decryptSubscription', () => {
	it('returns the subscription unchanged when the room is not ready', async () => {
		const room = createRoom();
		const subscription = { rid: 'r1', lastMessage: { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING } } as any;

		expect(await room.decryptSubscription(subscription)).toBe(subscription);
	});

	it('returns the subscription unchanged when there is no lastMessage', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const subscription = { rid: 'r1' } as any;

		expect(await room.decryptSubscription(subscription)).toBe(subscription);
	});

	it('returns the subscription unchanged when the lastMessage is not an e2e message', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const subscription = { rid: 'r1', lastMessage: { t: 'normal' } } as any;

		expect(await room.decryptSubscription(subscription)).toBe(subscription);
	});

	it('returns the subscription unchanged when the lastMessage is already decrypted', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const subscription = { rid: 'r1', lastMessage: { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.DONE } } as any;

		expect(await room.decryptSubscription(subscription)).toBe(subscription);
	});

	it('returns the subscription unchanged when it has no rid', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const subscription = { lastMessage: { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING } } as any;

		expect(await room.decryptSubscription(subscription)).toBe(subscription);
	});

	it('reuses the cached decrypted lastMessage when the incoming one is the same message already decrypted locally', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const updatedAt = '2024-01-01T00:00:00.000Z';
		room.subscription = {
			lastMessage: { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.DONE, msg: 'cached-plain', _updatedAt: updatedAt }
		} as any;
		const decryptSpy = jest.spyOn(room, 'decrypt');
		const subscription = {
			rid: 'r1',
			lastMessage: { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, msg: 'cipher', _updatedAt: updatedAt }
		} as any;

		const result = await room.decryptSubscription(subscription);

		expect(decryptSpy).not.toHaveBeenCalled();
		expect(result.lastMessage).toBe(room.subscription!.lastMessage);
	});

	it('decrypts the incoming lastMessage otherwise', async () => {
		const room = createRoom();
		(room as any).ready = true;
		room.subscription = null;
		const decrypted = { msg: 'plain', e2e: 'done' };
		jest.spyOn(room, 'decrypt').mockResolvedValue(decrypted as any);
		const subscription = { rid: 'r1', lastMessage: { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, msg: 'cipher' } } as any;

		const result = await room.decryptSubscription(subscription);

		expect(room.decrypt).toHaveBeenCalledWith(subscription.lastMessage);
		expect(result.lastMessage).toBe(decrypted);
	});
});

describe('handshake', () => {
	it('resolves immediately without touching the database when already ready', async () => {
		const room = createRoom();
		(room as any).ready = true;

		await room.handshake();

		expect(mockGetSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	it('returns the shared readyPromise, without re-fetching the subscription, when already establishing', async () => {
		const room = createRoom();
		(room as any).establishing = true;

		const resultPromise = room.handshake();
		room.readyPromise.resolve('resolved-value');

		await expect(resultPromise).resolves.toBe('resolved-value');
		expect(mockGetSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	it('stays not-ready when the room has no subscription', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue(null);

		await room.handshake();

		expect(room.ready).toBe(false);
	});

	it('stays not-ready when the subscription is not encrypted', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: false });

		await room.handshake();

		expect(room.ready).toBe(false);
	});

	it('waits for the E2E password (no private key) without requesting a room key', async () => {
		const room = createRoom({ privateKey: null });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, e2eKeyId: 'k1' });

		await room.handshake();

		expect(room.ready).toBe(false);
		expect(mockE2eRequestRoomKey).not.toHaveBeenCalled();
	});

	it('imports and accepts a suggested group key, discarding the cached room instance once it is ready', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, E2ESuggestedKey: roomKeys.v2.E2EKey });
		mockE2eAcceptSuggestedGroupKey.mockResolvedValue({ success: true });

		await room.handshake();
		await room.readyPromise;

		expect(room.keyID).toBe(roomKeys.v2.keyID);
		expect(room.algorithm).toBe('A256GCM');
		expect(room.sessionKeyExportedString).toBe(roomKeys.v2.sessionKeyExportedString);
		expect(mockE2eAcceptSuggestedGroupKey).toHaveBeenCalledWith('room1');
		expect(mockE2eRejectSuggestedGroupKey).not.toHaveBeenCalled();
		expect(room.encryption.deleteRoomInstance).toHaveBeenCalledWith('room1');
		expect(room.ready).toBe(true);
	});

	it('rejects the suggested group key and falls through to the E2EKey when accepting it fails', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({
			encrypted: true,
			E2ESuggestedKey: roomKeys.v2.E2EKey,
			E2EKey: roomKeys.v1.E2EKey
		});
		mockE2eAcceptSuggestedGroupKey.mockRejectedValue(new Error('rejected by server'));
		mockE2eRejectSuggestedGroupKey.mockResolvedValue({ success: true });

		await room.handshake();
		await room.readyPromise;

		expect(mockE2eRejectSuggestedGroupKey).toHaveBeenCalledWith('room1');
		expect(room.keyID).toBe(roomKeys.v1.keyID);
		expect(room.algorithm).toBe('A128CBC');
		expect(room.ready).toBe(true);
	});

	it('logs and falls through to the E2EKey when importing the suggested key throws', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({
			encrypted: true,
			E2ESuggestedKey: UNDECRYPTABLE_E2E_KEY,
			E2EKey: roomKeys.v1.E2EKey
		});

		await room.handshake();
		await room.readyPromise;

		expect(mockE2eAcceptSuggestedGroupKey).not.toHaveBeenCalled();
		expect(room.keyID).toBe(roomKeys.v1.keyID);
		expect(room.ready).toBe(true);
	});

	it('imports the E2EKey and becomes ready', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, E2EKey: roomKeys.v2.E2EKey, e2eKeyId: roomKeys.v2.keyID });

		await room.handshake();
		await room.readyPromise;

		expect(room.ready).toBe(true);
		expect(room.keyID).toBe(roomKeys.v2.keyID);
		expect(room.algorithm).toBe('A256GCM');
		expect(room.sessionKeyExportedString).toBe(roomKeys.v2.sessionKeyExportedString);
		expect(Buffer.from(room.roomKey)).toEqual(Buffer.from(sessionKeyBytes(roomKeys.v2.sessionKeyExportedString)));
		expect(mockE2eRequestRoomKey).not.toHaveBeenCalled();
	});

	it('requests the room key when the E2EKey cannot be decrypted with the private key', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({
			encrypted: true,
			E2EKey: UNDECRYPTABLE_E2E_KEY,
			e2eKeyId: roomKeys.v2.keyID
		});
		mockE2eRequestRoomKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(room.ready).toBe(false);
		expect(room.establishing).toBe(false);
		expect(mockE2eRequestRoomKey).toHaveBeenCalledWith('room1', roomKeys.v2.keyID);
		(room.requestRoomKey as unknown as { stop: () => void }).stop();
	});

	it('creates a brand new room key and discards the cached instance when there is no e2eKeyId at all', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		const createRoomKeySpy = jest.spyOn(room, 'createRoomKey').mockImplementation(() => {
			room.keyID = 'brand-new';
			return Promise.resolve();
		});

		await room.handshake();

		expect(createRoomKeySpy).toHaveBeenCalled();
		expect(room.encryption.deleteRoomInstance).toHaveBeenCalledWith('room1');
		expect(mockE2eRequestRoomKey).not.toHaveBeenCalled();
		expect(room.ready).toBe(true);
	});

	it('releases a concurrent handshake once the brand new room key is created', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		let finishCreatingKey = () => {};
		let markCreatingStarted = () => {};
		const creatingStarted = new Promise<void>(resolve => {
			markCreatingStarted = resolve;
		});
		jest.spyOn(room, 'createRoomKey').mockImplementation(() => {
			markCreatingStarted();
			return new Promise<void>(resolve => {
				finishCreatingKey = resolve;
			});
		});

		const creating = room.handshake();
		await creatingStarted;
		const waiting = room.handshake();
		finishCreatingKey();

		await Promise.all([creating, waiting]);
		expect(room.ready).toBe(true);
	});

	it('requests the room key from other participants when a keyId exists but no key material does', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, e2eKeyId: 'pending-kid' });
		mockE2eRequestRoomKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(mockE2eRequestRoomKey).toHaveBeenCalledWith('room1', 'pending-kid');
		expect(room.ready).toBe(false);
		(room.requestRoomKey as unknown as { stop: () => void }).stop();
	});

	it('logs and still requests the room key when creating a brand new key fails', async () => {
		const room = createRoom();
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		jest.spyOn(room, 'createRoomKey').mockRejectedValue(new Error('cannot create'));
		mockE2eRequestRoomKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(mockE2eRequestRoomKey).toHaveBeenCalledWith('room1', undefined);
		(room.requestRoomKey as unknown as { stop: () => void }).stop();
	});
});
