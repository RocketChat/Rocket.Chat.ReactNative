import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rsaImportKey } from '@rocket.chat/mobile-crypto';

import Encryption from '../encryption';
import EncryptionRoom from '../room';
import { type IEncryption } from '../definitions';
import { type IMessage, type TSendFileMessageFileInfo, type TSubscriptionModel } from '~/definitions';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import file from './fixtures/file.json';
import roomKeys from './fixtures/roomKeys.json';
import user from './fixtures/user.json';

jest.mock('expo-file-system/legacy', () => ({
	deleteAsync: (fileUri: string) => require('node:fs/promises').rm(require('node:url').fileURLToPath(fileUri))
}));

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.13.0' }, settings: {} }) }
}));

const plaintext = Buffer.from(file.plaintext, 'base64');

let tempDirectory: string;

beforeAll(async () => {
	tempDirectory = await mkdtemp(join(tmpdir(), 'e2ee-file-'));
});

afterAll(() => rm(tempDirectory, { recursive: true, force: true }));

const writeTempFile = async (name: string, contents: Buffer) => {
	const path = join(await mkdtemp(join(tempDirectory, 'file-')), name);
	await writeFile(path, contents);
	return pathToFileURL(path).href;
};

const { subtle } = globalThis.crypto;

const sha256Hex = async (data: Buffer) => Buffer.from(await subtle.digest('SHA-256', new Uint8Array(data))).toString('hex');

const webClientDecryptFile = async (encrypted: Buffer, { key, iv }: { key: JsonWebKey; iv: string }) => {
	const cryptoKey = await subtle.importKey('jwk', key, { name: 'AES-CTR' }, false, ['decrypt']);
	const decrypted = await subtle.decrypt(
		{ name: 'AES-CTR', counter: Buffer.from(iv, 'base64'), length: 64 },
		cryptoKey,
		new Uint8Array(encrypted)
	);
	return Buffer.from(decrypted);
};

const createReadyRoom = async () => {
	(getSubscriptionByRoomId as jest.Mock).mockResolvedValue({
		encrypted: true,
		E2EKey: roomKeys.v2.E2EKey,
		e2eKeyId: roomKeys.v2.keyID
	} as unknown as TSubscriptionModel);
	const encryption: IEncryption = {
		privateKey: await rsaImportKey(JSON.parse(user.privateKey)),
		publicKey: user.publicKey,
		deleteRoomInstance: jest.fn()
	};
	const room = new EncryptionRoom('room-id', user.userId, encryption);
	await room.handshake();
	return room;
};

describe('file encryption', () => {
	it('encrypts a file in a form the web client and itself decrypt and verify', async () => {
		const room = await createReadyRoom();
		const fileInfo = { path: await writeTempFile('photo.txt', plaintext), name: 'photo.txt', type: 'text/plain', size: 1 };

		const { file: encryptedFile, fileContent } = await room.encryptFile('room-id', fileInfo as TSendFileMessageFileInfo);
		const { encryption, hashes } = await room.decryptContent(fileContent as IMessage['content']);
		const decryptedByWebClient = await webClientDecryptFile(await readFile(fileURLToPath(encryptedFile.path)), encryption);
		const decryptedPath = await Encryption.decryptFile('message-id', encryptedFile.path, encryption, hashes.sha256);

		expect(decryptedByWebClient).toEqual(plaintext);
		expect(await sha256Hex(decryptedByWebClient)).toBe(hashes.sha256);
		expect(await readFile(fileURLToPath(decryptedPath as string))).toEqual(plaintext);
	});

	it('decrypts a file encrypted by the web client', async () => {
		const path = await writeTempFile('encrypted', Buffer.from(file.encrypted, 'base64'));

		const decryptedPath = await Encryption.decryptFile('message-id', path, { key: file.key, iv: file.iv }, file.hash);

		expect(await readFile(fileURLToPath(decryptedPath as string))).toEqual(plaintext);
	});

	it('deletes the decrypted file and returns null when its checksum does not match', async () => {
		const path = await writeTempFile('encrypted', Buffer.from(file.encrypted, 'base64'));
		const otherChecksum = '0'.repeat(64);

		const decryptedPath = await Encryption.decryptFile('message-id', path, { key: file.key, iv: file.iv }, otherChecksum);

		expect(decryptedPath).toBeNull();
		expect(existsSync(fileURLToPath(path))).toBe(false);
	});
});
