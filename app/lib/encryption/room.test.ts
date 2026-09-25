import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import { sha256 } from 'js-sha256';
import {
	rsaDecrypt,
	randomBytes,
	rsaImportKey,
	rsaEncrypt,
	aesEncrypt,
	calculateFileChecksum,
	aesDecrypt,
	aesGcmEncrypt,
	aesGcmDecrypt,
	randomUuid,
	aesEncryptFile
} from '@rocket.chat/mobile-crypto';

import EncryptionRoom from './room';
import {
	b64ToBuffer,
	bufferToB64,
	bufferToB64URI,
	bufferToHex,
	joinVectorData,
	utf8ToBuffer,
	encodePrefixedBase64
} from './utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../constants/keys';
import { type IEncryption } from './definitions';
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

jest.mock('@rocket.chat/mobile-crypto', () => ({
	rsaDecrypt: jest.fn(),
	randomBytes: jest.fn(),
	rsaImportKey: jest.fn(),
	rsaEncrypt: jest.fn(),
	aesEncrypt: jest.fn(),
	calculateFileChecksum: jest.fn(),
	aesDecrypt: jest.fn(),
	aesGcmEncrypt: jest.fn(),
	aesGcmDecrypt: jest.fn(),
	randomUuid: jest.fn(),
	aesEncryptFile: jest.fn(),
	aesDecryptFile: jest.fn()
}));

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

const mockRsaDecrypt = rsaDecrypt as jest.Mock;
const mockRandomBytes = randomBytes as jest.Mock;
const mockRsaImportKey = rsaImportKey as jest.Mock;
const mockRsaEncrypt = rsaEncrypt as jest.Mock;
const mockAesEncrypt = aesEncrypt as jest.Mock;
const mockCalculateFileChecksum = calculateFileChecksum as jest.Mock;
const mockAesDecrypt = aesDecrypt as jest.Mock;
const mockAesGcmEncrypt = aesGcmEncrypt as jest.Mock;
const mockAesGcmDecrypt = aesGcmDecrypt as jest.Mock;
const mockRandomUuid = randomUuid as jest.Mock;
const mockAesEncryptFile = aesEncryptFile as jest.Mock;

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

const createEncryption = (overrides: Partial<IEncryption> = {}): IEncryption => ({
	privateKey: 'private-key',
	publicKey: 'public-key',
	deleteRoomInstance: jest.fn(),
	...overrides
});

const createRoom = (encryptionOverrides: Partial<IEncryption> = {}) =>
	new EncryptionRoom('room1', 'user1', createEncryption(encryptionOverrides));

// Fixture for a valid prefixed-base64 E2EKey: any prefix + 256 zero-ish bytes base64-encoded.
const build256ByteBase64 = (fill = 7) => bufferToB64(new Uint8Array(256).fill(fill).buffer);

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
	it('decrypts an E2EKey into session key, room key, keyID and algorithm', async () => {
		const room = createRoom();
		const roomKeyBytes = new Uint8Array(32).fill(9).buffer;
		const sessionKeyExported = {
			kty: 'oct',
			alg: 'A256GCM',
			k: bufferToB64URI(roomKeyBytes),
			ext: true,
			key_ops: ['encrypt', 'decrypt']
		};
		const sessionKeyExportedString = EJSON.stringify(sessionKeyExported);
		mockRsaDecrypt.mockResolvedValue(sessionKeyExportedString);
		const e2eKey = `kid123${build256ByteBase64()}`;

		const result = await room.importRoomKey(e2eKey, 'my-private-key');

		expect(mockRsaDecrypt).toHaveBeenCalledWith(build256ByteBase64(), 'my-private-key');
		expect(result.keyID).toBe('kid123');
		expect(result.algorithm).toBe('A256GCM');
		expect(result.sessionKeyExportedString).toBe(sessionKeyExportedString);
		expect(bufferToB64(result.roomKey)).toBe(bufferToB64(b64ToBuffer(sessionKeyExported.k)));
	});

	it('wraps any failure (malformed input, bad decrypt, invalid EJSON) into a plain Error', async () => {
		const room = createRoom();

		await expect(room.importRoomKey('too-short', 'priv')).rejects.toThrow();

		mockRsaDecrypt.mockResolvedValue('not-valid-ejson');
		await expect(room.importRoomKey(`kid123${build256ByteBase64()}`, 'priv')).rejects.toThrow();
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
	it('creates an A256GCM key with a random UUID keyID for servers >= 7.13.0', async () => {
		mockGetState.mockReturnValue({ server: { version: '7.13.0' } });
		mockRandomBytes.mockResolvedValue(bufferToB64(new Uint8Array(32).fill(3).buffer));
		mockRandomUuid.mockResolvedValue('uuid-123');
		const room = createRoom();

		await room.createNewRoomKey();

		expect(mockRandomBytes).toHaveBeenCalledWith(32);
		expect(room.algorithm).toBe('A256GCM');
		expect(room.keyID).toBe('uuid-123');
		const parsed = EJSON.parse(room.sessionKeyExportedString);
		expect(parsed).toMatchObject({ kty: 'oct', alg: 'A256GCM', ext: true, key_ops: ['encrypt', 'decrypt'] });
		expect(parsed.k).toBe(bufferToB64URI(room.roomKey));
	});

	it('creates an A128CBC key with a sha256-derived keyID for 7.0.0 <= servers < 7.13.0', async () => {
		mockGetState.mockReturnValue({ server: { version: '7.5.0' } });
		mockRandomBytes.mockResolvedValue(bufferToB64(new Uint8Array(16).fill(5).buffer));
		const room = createRoom();

		await room.createNewRoomKey();

		expect(mockRandomBytes).toHaveBeenCalledWith(16);
		expect(room.algorithm).toBe('A128CBC');
		expect(room.keyID).toBe(sha256(room.sessionKeyExportedString).slice(0, 12));
	});

	it('creates an A128CBC key with a base64-derived keyID for servers < 7.0.0', async () => {
		mockGetState.mockReturnValue({ server: { version: '6.5.0' } });
		mockRandomBytes.mockResolvedValue(bufferToB64(new Uint8Array(16).fill(5).buffer));
		const room = createRoom();

		await room.createNewRoomKey();

		expect(room.algorithm).toBe('A128CBC');
		expect(room.keyID).toBe(Base64.encode(room.sessionKeyExportedString).slice(0, 12));
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

	it('creates a fresh room key and returns the new key id plus the key encrypted for the current user', async () => {
		const room = createRoom({ publicKey: 'pub-key' });
		jest.spyOn(room, 'createNewRoomKey').mockImplementation(() => {
			room.keyID = 'k1';
			return Promise.resolve();
		});
		jest.spyOn(room, 'encryptRoomKeyForUser').mockResolvedValue('encrypted-for-me');

		const result = await room.resetRoomKey();

		expect(result).toEqual({ e2eKeyId: 'k1', e2eKey: 'encrypted-for-me' });
		expect(room.encryptRoomKeyForUser).toHaveBeenCalledWith('pub-key');
	});

	it('rethrows when creating the new key fails', async () => {
		const room = createRoom({ publicKey: 'pub-key' });
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
	it('rsa-encrypts the session key and prefixes it with the room keyID', async () => {
		const room = createRoom();
		room.keyID = 'kid1';
		room.sessionKeyExportedString = 'session-string';
		mockRsaImportKey.mockResolvedValue('imported-user-key');
		const encryptedBuffer = new Uint8Array(256).fill(4).buffer;
		mockRsaEncrypt.mockResolvedValue(bufferToB64(encryptedBuffer));

		const result = await room.encryptRoomKeyForUser(EJSON.stringify({ n: 'pub' }));

		expect(mockRsaImportKey).toHaveBeenCalledWith({ n: 'pub' });
		expect(mockRsaEncrypt).toHaveBeenCalledWith('session-string', 'imported-user-key');
		expect(result).toBe(encodePrefixedBase64('kid1', encryptedBuffer));
	});

	it('logs and returns undefined when the rsa operation fails', async () => {
		const room = createRoom();
		room.keyID = 'kid1';
		room.sessionKeyExportedString = 's';
		mockRsaImportKey.mockRejectedValue(new Error('bad key'));

		const result = await room.encryptRoomKeyForUser(EJSON.stringify({ n: 'pub' }));

		expect(result).toBeUndefined();
	});
});

describe('encryptOldKeysForParticipant', () => {
	it('returns undefined when there are no old room keys', async () => {
		const room = createRoom();
		await expect(room.encryptOldKeysForParticipant('pub', undefined)).resolves.toBeUndefined();
		await expect(room.encryptOldKeysForParticipant('pub', [])).resolves.toBeUndefined();
	});

	it('logs and returns undefined when the public key cannot be imported', async () => {
		const room = createRoom();
		mockRsaImportKey.mockRejectedValue(new Error('bad key'));

		const result = await room.encryptOldKeysForParticipant(EJSON.stringify({ n: 'bad-pub' }), [{ e2eKeyId: 'a', E2EKey: 'x' }]);

		expect(result).toBeUndefined();
	});

	it('re-encrypts each old key, prefixed with its own keyID, skipping entries without an E2EKey', async () => {
		const room = createRoom();
		mockRsaImportKey.mockResolvedValue('imported');
		mockRsaEncrypt.mockImplementation((data: string) => `enc(${data})`);
		const oldKeys = [
			{ e2eKeyId: 'k1', E2EKey: 'old-key-1', ts: 't1' },
			{ e2eKeyId: 'k2', ts: 't2' },
			{ e2eKeyId: 'k3', E2EKey: 'old-key-3', ts: 't3' }
		];

		const result = await room.encryptOldKeysForParticipant(EJSON.stringify({ n: 'pub' }), oldKeys);

		expect(result).toEqual([
			{ e2eKeyId: 'k1', ts: 't1', E2EKey: 'k1enc(old-key-1)' },
			{ e2eKeyId: 'k3', ts: 't3', E2EKey: 'k3enc(old-key-3)' }
		]);
	});
});

describe('exportOldRoomKeys', () => {
	it('returns [] when there are no old keys', async () => {
		const room = createRoom();
		await expect(room.exportOldRoomKeys(undefined)).resolves.toEqual([]);
		await expect(room.exportOldRoomKeys([])).resolves.toEqual([]);
	});

	it('skips keys without an E2EKey and keys that fail to decrypt, keeping the rest', async () => {
		const room = createRoom({ privateKey: 'priv' });
		jest.spyOn(room, 'importRoomKey').mockImplementation((E2EKey: string) => {
			if (E2EKey === 'bad') throw new Error('cannot decrypt');
			return Promise.resolve({
				sessionKeyExportedString: `decrypted(${E2EKey})`,
				roomKey: new ArrayBuffer(0),
				keyID: 'kid',
				algorithm: 'A256GCM'
			});
		});

		const result = await room.exportOldRoomKeys([
			{ e2eKeyId: 'k1' },
			{ e2eKeyId: 'k2', E2EKey: 'good' },
			{ e2eKeyId: 'k3', E2EKey: 'bad' }
		]);

		expect(result).toEqual([{ e2eKeyId: 'k2', E2EKey: 'decrypted(good)' }]);
	});

	it('skips every key when there is no private key available', async () => {
		const room = createRoom({ privateKey: null });

		const result = await room.exportOldRoomKeys([{ e2eKeyId: 'k1', E2EKey: 'good' }]);

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
		const room = createRoom();
		room.subscription = { oldRoomKeys: [{ e2eKeyId: 'old1', E2EKey: 'x', ts: 't' }] } as any;
		jest.spyOn(room, 'exportOldRoomKeys').mockResolvedValue([{ e2eKeyId: 'old1', E2EKey: 'decrypted' }] as any);
		jest.spyOn(room, 'encryptRoomKeyForUser').mockImplementation((pub: string) => Promise.resolve(`key(${pub})`));
		jest.spyOn(room, 'encryptOldKeysForParticipant').mockResolvedValue([{ e2eKeyId: 'old1', E2EKey: 'reencrypted' }] as any);
		mockE2eGetUsersOfRoomWithoutKey.mockResolvedValue({
			success: true,
			users: [
				{ _id: 'u1', e2e: { public_key: 'pub1' } },
				{ _id: 'u2', e2e: { public_key: 'pub2' } }
			]
		});

		await room.encryptKeyForOtherParticipants();

		expect(mockProvideUsersSuggestedGroupKeys).toHaveBeenCalledWith({
			room1: [
				{ _id: 'u1', key: 'key(pub1)', oldKeys: [{ e2eKeyId: 'old1', E2EKey: 'reencrypted' }] },
				{ _id: 'u2', key: 'key(pub2)', oldKeys: [{ e2eKeyId: 'old1', E2EKey: 'reencrypted' }] }
			]
		});
		expect(mockE2eUpdateGroupKey).not.toHaveBeenCalled();
	});

	it('updates each user individually for servers < 7.0.0, skipping users without a public key', async () => {
		mockGetState.mockReturnValue({ server: { version: '6.9.0' }, settings: {} });
		const room = createRoom();
		jest.spyOn(room, 'encryptRoomKeyForUser').mockImplementation((pub: string) => Promise.resolve(`key(${pub})`));
		mockE2eGetUsersOfRoomWithoutKey.mockResolvedValue({
			success: true,
			users: [{ _id: 'u1', e2e: { public_key: 'pub1' } }, { _id: 'u2' }]
		});

		await room.encryptKeyForOtherParticipants();

		expect(mockE2eUpdateGroupKey).toHaveBeenCalledTimes(1);
		expect(mockE2eUpdateGroupKey).toHaveBeenCalledWith('u1', 'room1', 'key(pub1)');
		expect(mockProvideUsersSuggestedGroupKeys).not.toHaveBeenCalled();
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

		const result = await room.encryptGroupKeyForParticipantsWaitingForTheKeys([{ _id: 'u1', public_key: 'pub1' }]);

		expect(result).toBeUndefined();
	});

	it('encrypts the room key and old keys for each waiting user', async () => {
		const room = createRoom();
		(room as any).ready = true;
		jest.spyOn(room, 'exportOldRoomKeys').mockResolvedValue([{ e2eKeyId: 'old', E2EKey: 'dec' }] as any);
		jest.spyOn(room, 'encryptRoomKeyForUser').mockImplementation((pub: string) => Promise.resolve(`key(${pub})`));
		jest.spyOn(room, 'encryptOldKeysForParticipant').mockResolvedValue([{ e2eKeyId: 'old', E2EKey: 'renc' }] as any);

		const result = await room.encryptGroupKeyForParticipantsWaitingForTheKeys([
			{ _id: 'u1', public_key: 'pub1' },
			{ _id: 'u2', public_key: 'pub2' }
		]);

		expect(result).toEqual([
			{ _id: 'u1', key: 'key(pub1)', oldKeys: [{ e2eKeyId: 'old', E2EKey: 'renc' }] },
			{ _id: 'u2', key: 'key(pub2)', oldKeys: [{ e2eKeyId: 'old', E2EKey: 'renc' }] }
		]);
	});
});

describe('encryptText', () => {
	it('uses AES-GCM with a 12-byte IV for the A256GCM algorithm', async () => {
		const room = createRoom();
		room.algorithm = 'A256GCM';
		room.keyID = 'kid';
		room.roomKey = new Uint8Array(32).fill(2).buffer;
		const ivB64 = bufferToB64(new Uint8Array(12).fill(9).buffer);
		mockRandomBytes.mockResolvedValue(ivB64);
		mockAesGcmEncrypt.mockResolvedValue('gcm-ciphertext');

		const result = await room.encryptText('hello');

		expect(mockRandomBytes).toHaveBeenCalledWith(12);
		expect(mockAesGcmEncrypt).toHaveBeenCalledWith(
			bufferToB64(utf8ToBuffer('hello')),
			bufferToHex(room.roomKey),
			bufferToHex(b64ToBuffer(ivB64))
		);
		expect(result).toEqual({ algorithm: 'rc.v2.aes-sha2', kid: 'kid', iv: ivB64, ciphertext: 'gcm-ciphertext' });
	});

	it('uses AES-CBC with a 16-byte IV for any other algorithm, prefixing the ciphertext with the keyID', async () => {
		const room = createRoom();
		room.algorithm = 'A128CBC';
		room.keyID = 'kid';
		room.roomKey = new Uint8Array(16).fill(2).buffer;
		const ivB64 = bufferToB64(new Uint8Array(16).fill(9).buffer);
		mockRandomBytes.mockResolvedValue(ivB64);
		const cipherB64 = bufferToB64(new Uint8Array([1, 2, 3]).buffer);
		mockAesEncrypt.mockResolvedValue(cipherB64);

		const result = await room.encryptText('hello');

		expect(mockRandomBytes).toHaveBeenCalledWith(16);
		const expectedCiphertext = `kid${bufferToB64(joinVectorData(b64ToBuffer(ivB64), b64ToBuffer(cipherB64)))}`;
		expect(result).toEqual({ algorithm: 'rc.v1.aes-sha2', ciphertext: expectedCiphertext });
	});
});

describe('encrypt', () => {
	it('returns the message unchanged when the room is not ready', async () => {
		const room = createRoom();
		const message = { _id: 'm1', rid: 'r1', msg: 'hi' } as any;

		const result = await room.encrypt(message);

		expect(result).toBe(message);
	});

	it('encrypts the message text, marks it pending and strips the plaintext msg', async () => {
		const room = createRoom();
		(room as any).ready = true;
		const content = { algorithm: 'rc.v2.aes-sha2', kid: 'k', iv: 'i', ciphertext: 'c' };
		jest.spyOn(room, 'encryptText').mockResolvedValue(content as any);
		const message = { _id: 'm1', rid: 'r1', msg: 'hi' } as any;

		const result = await room.encrypt(message);

		expect(room.encryptText).toHaveBeenCalledWith(EJSON.stringify({ msg: 'hi' }));
		expect(result).toMatchObject({ _id: 'm1', rid: 'r1', t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, content });
		expect(result.msg).toBeUndefined();
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
	const baseFile = { path: 'file:///a.png', name: 'a.png', size: 1234, type: 'image/png', width: 100, height: 200 } as any;

	beforeEach(() => {
		mockRandomBytes.mockImplementation((n: number) => bufferToB64(new Uint8Array(n).fill(n === 16 ? 1 : 2).buffer));
		mockCalculateFileChecksum.mockResolvedValue('checksum123');
		mockAesEncryptFile.mockResolvedValue('file:///encrypted-path');
	});

	const lastEncryptTextCall = (room: EncryptionRoom) => {
		const calls = (room.encryptText as jest.Mock).mock.calls;
		return calls[calls.length - 1][0];
	};

	it('encrypts the file path, hashes the file name and returns the fileContent envelope', async () => {
		const room = createRoom();
		jest
			.spyOn(room, 'encryptText')
			.mockResolvedValue({ algorithm: 'rc.v2.aes-sha2', kid: 'kid', iv: 'iv', ciphertext: 'ct' } as any);

		const result = await room.encryptFile('room1', baseFile);

		expect(mockAesEncryptFile).toHaveBeenCalled();
		expect(result.file.path).toBe('file:///encrypted-path');
		expect(result.file.type).toBe('file');
		expect(result.file.name).toBe(sha256('a.png'));
		expect(result.fileContent).toEqual({ algorithm: 'rc.v2.aes-sha2', kid: 'kid', iv: 'iv', ciphertext: 'ct' });
	});

	it('builds an image attachment via getContent for image files', async () => {
		const room = createRoom();
		jest.spyOn(room, 'encryptText').mockResolvedValue('encrypted-content' as any);

		const { getContent } = await room.encryptFile('room1', baseFile);
		const content = await getContent!('file-id', 'https://server/file-url');

		const parsed = EJSON.parse(lastEncryptTextCall(room));
		expect(parsed.attachments[0]).toMatchObject({
			image_url: 'https://server/file-url',
			image_type: 'image/png',
			image_size: 1234,
			image_dimensions: { width: 100, height: 200 }
		});
		expect(parsed.files[0]).toEqual({ _id: 'file-id', name: 'a.png', type: 'image/png', size: 1234 });
		expect(content).toBe('encrypted-content');
	});

	it('embeds the file caption in the encrypted getContent payload when one is provided', async () => {
		const room = createRoom();
		jest.spyOn(room, 'encryptText').mockResolvedValue('c' as any);
		const fileWithCaption = { ...baseFile, msg: 'check this out' };

		const { getContent } = await room.encryptFile('room1', fileWithCaption);
		await getContent!('id', 'url');

		const parsed = EJSON.parse(lastEncryptTextCall(room));
		expect(parsed.msg).toBe('check this out');
	});

	it('embeds an empty string as msg in the encrypted getContent payload when there is no caption', async () => {
		const room = createRoom();
		jest.spyOn(room, 'encryptText').mockResolvedValue('c' as any);

		const { getContent } = await room.encryptFile('room1', baseFile);
		await getContent!('id', 'url');

		const parsed = EJSON.parse(lastEncryptTextCall(room));
		expect(parsed.msg).toBe('');
	});

	it('builds an audio attachment via getContent for audio files', async () => {
		const room = createRoom();
		jest.spyOn(room, 'encryptText').mockResolvedValue('c' as any);
		const audioFile = { ...baseFile, type: 'audio/mp4', width: undefined, height: undefined };

		const { getContent } = await room.encryptFile('room1', audioFile);
		await getContent!('id', 'url');

		const parsed = EJSON.parse(lastEncryptTextCall(room));
		expect(parsed.attachments[0]).toMatchObject({ audio_url: 'url', audio_type: 'audio/mp4', audio_size: 1234 });
	});

	it('builds a video attachment via getContent for video files', async () => {
		const room = createRoom();
		jest.spyOn(room, 'encryptText').mockResolvedValue('c' as any);
		const videoFile = { ...baseFile, type: 'video/mp4', width: undefined, height: undefined };

		const { getContent } = await room.encryptFile('room1', videoFile);
		await getContent!('id', 'url');

		const parsed = EJSON.parse(lastEncryptTextCall(room));
		expect(parsed.attachments[0]).toMatchObject({ video_url: 'url', video_type: 'video/mp4', video_size: 1234 });
	});

	it('builds a generic file attachment with an uppercased extension for other file types', async () => {
		const room = createRoom();
		jest.spyOn(room, 'encryptText').mockResolvedValue('c' as any);
		const docFile = {
			...baseFile,
			type: 'application/pdf',
			name: 'report.pdf',
			path: 'file:///report.pdf',
			width: undefined,
			height: undefined
		};

		const { getContent } = await room.encryptFile('room1', docFile);
		await getContent!('id', 'url');

		const parsed = EJSON.parse(lastEncryptTextCall(room));
		expect(parsed.attachments[0]).toMatchObject({ size: 1234, format: 'PDF' });
		expect(parsed.attachments[0].hashes).toEqual({ sha256: 'checksum123' });
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
	it('uses AES-GCM decrypt for A256GCM and parses the plaintext EJSON', async () => {
		const room = createRoom();
		const payload = { msg: 'hello' };
		mockAesGcmDecrypt.mockResolvedValue(bufferToB64(utf8ToBuffer(EJSON.stringify(payload))));

		const result = await room.doDecrypt('ct', new Uint8Array(32).buffer, new Uint8Array(12).buffer, 'A256GCM');

		expect(mockAesGcmDecrypt).toHaveBeenCalled();
		expect(mockAesDecrypt).not.toHaveBeenCalled();
		expect(result).toEqual(payload);
	});

	it('uses AES-CBC decrypt for any other algorithm', async () => {
		const room = createRoom();
		const payload = { msg: 'world' };
		mockAesDecrypt.mockResolvedValue(bufferToB64(utf8ToBuffer(EJSON.stringify(payload))));

		const result = await room.doDecrypt('ct', new Uint8Array(16).buffer, new Uint8Array(16).buffer, 'A128CBC');

		expect(mockAesDecrypt).toHaveBeenCalled();
		expect(mockAesGcmDecrypt).not.toHaveBeenCalled();
		expect(result).toEqual(payload);
	});

	it('returns null when the native layer yields no plaintext', async () => {
		const room = createRoom();
		mockAesDecrypt.mockResolvedValue(null);

		const result = await room.doDecrypt('ct', new Uint8Array(16).buffer, new Uint8Array(16).buffer, 'A128CBC');

		expect(result).toBeNull();
	});
});

describe('decryptContent', () => {
	it('returns null for empty content', async () => {
		const room = createRoom();
		expect(await room.decryptContent('' as any)).toBeNull();
		expect(await room.decryptContent(null as any)).toBeNull();
	});

	it('decrypts with the current room key when the kid matches', async () => {
		const room = createRoom();
		room.keyID = 'current';
		room.roomKey = new Uint8Array(32).buffer;
		room.algorithm = 'A256GCM';
		jest.spyOn(room, 'parse').mockReturnValue({ kid: 'current', iv: new Uint8Array(12).buffer, ciphertext: 'ct' });
		jest.spyOn(room, 'doDecrypt').mockResolvedValue({ msg: 'plain' });

		const result = await room.decryptContent('payload' as any);

		expect(room.doDecrypt).toHaveBeenCalledWith('ct', room.roomKey, expect.any(ArrayBuffer), 'A256GCM');
		expect(result).toEqual({ msg: 'plain' });
	});

	it('falls back to a matching old room key when the kid does not match the current one', async () => {
		const room = createRoom({ privateKey: 'priv' });
		room.keyID = 'current';
		room.subscription = { oldRoomKeys: [{ e2eKeyId: 'old', E2EKey: 'oldkey', ts: new Date() }] } as any;
		jest.spyOn(room, 'parse').mockReturnValue({ kid: 'old', iv: new Uint8Array(12).buffer, ciphertext: 'ct' });
		const oldRoomKeyBuffer = new Uint8Array(16).buffer;
		jest
			.spyOn(room, 'importRoomKey')
			.mockResolvedValue({ roomKey: oldRoomKeyBuffer, algorithm: 'A128CBC', keyID: 'old', sessionKeyExportedString: 's' });
		jest.spyOn(room, 'doDecrypt').mockResolvedValue({ msg: 'old-plain' });

		const result = await room.decryptContent('payload' as any);

		expect(room.importRoomKey).toHaveBeenCalledWith('oldkey', 'priv');
		expect(room.doDecrypt).toHaveBeenCalledWith('ct', oldRoomKeyBuffer, expect.any(ArrayBuffer), 'A128CBC');
		expect(result).toEqual({ msg: 'old-plain' });
	});

	it('returns null when the kid matches neither the current nor any old room key', async () => {
		const room = createRoom();
		room.keyID = 'current';
		room.subscription = null;
		jest.spyOn(room, 'parse').mockReturnValue({ kid: 'unknown', iv: new Uint8Array(12).buffer, ciphertext: 'ct' });

		const result = await room.decryptContent('payload' as any);

		expect(result).toBeNull();
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
	it.each(['rc.v1.aes-sha2', 'rc.v2.aes-sha2'])('decrypts and merges content for %s attachments', async algorithm => {
		const room = createRoom();
		jest.spyOn(room, 'decryptContent').mockResolvedValue({ description: 'decrypted' } as any);
		const data = { content: { algorithm } } as any;

		const result = await room.decryptFileContent(data);

		expect(room.decryptContent).toHaveBeenCalledWith(data.content);
		expect((result as any).description).toBe('decrypted');
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

	it('decrypts pending e2e messages, marks attachments pending and resolves quotes', async () => {
		const room = createRoom();
		(room as any).ready = true;
		jest.spyOn(room, 'decryptContent').mockResolvedValue({ text: 'decrypted text', attachments: [{ title: 'a' }] });
		jest.spyOn(room, 'decryptQuoteAttachment').mockImplementation((m: any) => m);
		const message = {
			t: E2E_MESSAGE_TYPE,
			e2e: E2E_STATUS.PENDING,
			msg: 'cipher',
			content: { algorithm: 'rc.v2.aes-sha2' }
		} as any;

		const result = await room.decrypt(message);

		expect(result.msg).toBe('decrypted text');
		expect(result.e2e).toBe('done');
		expect(result.attachments).toEqual([{ title: 'a', e2e: 'pending' }]);
		expect(room.decryptQuoteAttachment).toHaveBeenCalled();
	});

	it('returns the original message unchanged when decryption throws', async () => {
		const room = createRoom();
		(room as any).ready = true;
		jest.spyOn(room, 'decryptContent').mockRejectedValue(new Error('bad'));
		const message = { t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, msg: 'cipher' } as any;

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

	it('imports and accepts a suggested group key, discarding the cached room instance (without resolving readiness)', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, E2ESuggestedKey: 'suggested-key' });
		jest
			.spyOn(room, 'importRoomKey')
			.mockResolvedValue({ keyID: 'sug-kid', roomKey: new ArrayBuffer(0), sessionKeyExportedString: 's', algorithm: 'A256GCM' });
		mockE2eAcceptSuggestedGroupKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(room.keyID).toBe('sug-kid');
		expect(mockE2eAcceptSuggestedGroupKey).toHaveBeenCalledWith('room1');
		expect(mockE2eRejectSuggestedGroupKey).not.toHaveBeenCalled();
		expect(room.encryption.deleteRoomInstance).toHaveBeenCalledWith('room1');
		expect(room.ready).toBe(false);
	});

	it('rejects the suggested group key and falls through to the E2EKey when accepting it fails', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, E2ESuggestedKey: 'suggested-key', E2EKey: 'main-key' });
		jest.spyOn(room, 'importRoomKey').mockImplementation((key: string) =>
			Promise.resolve({
				keyID: key === 'suggested-key' ? 'sug-kid' : 'main-kid',
				roomKey: new ArrayBuffer(0),
				sessionKeyExportedString: 's',
				algorithm: 'A256GCM'
			})
		);
		mockE2eAcceptSuggestedGroupKey.mockRejectedValue(new Error('rejected by server'));
		mockE2eRejectSuggestedGroupKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(mockE2eRejectSuggestedGroupKey).toHaveBeenCalledWith('room1');
		expect(room.keyID).toBe('main-kid');
		expect(room.ready).toBe(true);
	});

	it('logs and falls through to the E2EKey when importing the suggested key throws', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, E2ESuggestedKey: 'suggested-key', E2EKey: 'main-key' });
		jest.spyOn(room, 'importRoomKey').mockImplementation((key: string) => {
			if (key === 'suggested-key') throw new Error('cannot decrypt suggestion');
			return Promise.resolve({
				keyID: 'main-kid',
				roomKey: new ArrayBuffer(0),
				sessionKeyExportedString: 's',
				algorithm: 'A256GCM'
			});
		});

		await room.handshake();

		expect(room.keyID).toBe('main-kid');
		expect(room.ready).toBe(true);
	});

	it('imports the E2EKey and becomes ready', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, E2EKey: 'main-key' });
		jest
			.spyOn(room, 'importRoomKey')
			.mockResolvedValue({ keyID: 'main-kid', roomKey: new ArrayBuffer(0), sessionKeyExportedString: 's', algorithm: 'A256GCM' });

		await room.handshake();

		expect(room.ready).toBe(true);
		expect(room.keyID).toBe('main-kid');
		expect(mockE2eRequestRoomKey).not.toHaveBeenCalled();
	});

	it('creates a brand new room key and discards the cached instance when there is no e2eKeyId at all', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		const createRoomKeySpy = jest.spyOn(room, 'createRoomKey').mockImplementation(() => {
			room.keyID = 'brand-new';
			return Promise.resolve();
		});

		await room.handshake();

		expect(createRoomKeySpy).toHaveBeenCalled();
		expect(room.encryption.deleteRoomInstance).toHaveBeenCalledWith('room1');
		expect(mockE2eRequestRoomKey).not.toHaveBeenCalled();
	});

	it('requests the room key from other participants when a keyId exists but no key material does', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true, e2eKeyId: 'pending-kid' });
		mockE2eRequestRoomKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(mockE2eRequestRoomKey).toHaveBeenCalledWith('room1', 'pending-kid');
		expect(room.ready).toBe(false);
		(room.requestRoomKey as unknown as { stop: () => void }).stop();
	});

	it('logs and still requests the room key when creating a brand new key fails', async () => {
		const room = createRoom({ privateKey: 'priv' });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		jest.spyOn(room, 'createRoomKey').mockRejectedValue(new Error('cannot create'));
		mockE2eRequestRoomKey.mockResolvedValue({ success: true });

		await room.handshake();

		expect(mockE2eRequestRoomKey).toHaveBeenCalledWith('room1', undefined);
		(room.requestRoomKey as unknown as { stop: () => void }).stop();
	});
});
