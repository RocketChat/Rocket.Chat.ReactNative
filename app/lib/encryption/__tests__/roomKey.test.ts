import { rsaImportKey } from '@rocket.chat/mobile-crypto';

import EncryptionRoom from '../room';
import { type IEncryption } from '../definitions';
import roomKeys from './fixtures/roomKeys.json';
import user from './fixtures/user.json';

const mockGetState = jest.fn();
jest.mock('../../store/auxStore', () => ({
	store: { getState: () => mockGetState() }
}));

const { subtle } = globalThis.crypto;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const createRoom = async () => {
	const encryption: IEncryption = {
		privateKey: await rsaImportKey(JSON.parse(user.privateKey)),
		publicKey: user.publicKey,
		deleteRoomInstance: jest.fn()
	};
	return new EncryptionRoom('room-id', user.userId, encryption);
};

const sha256Hex = async (text: string) =>
	Buffer.from(await subtle.digest('SHA-256', new TextEncoder().encode(text))).toString('hex');

const webClientImportGroupKey = async (groupKey: string) => {
	const encoded = groupKey.slice(-344);
	const privateKey = await subtle.importKey('jwk', JSON.parse(user.privateKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
		'decrypt'
	]);
	const decrypted = await subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, Buffer.from(encoded, 'base64'));
	const sessionKeyExportedString = Buffer.from(decrypted).toString('latin1');
	const jwk = JSON.parse(sessionKeyExportedString);
	const name = jwk.alg === 'A256GCM' ? 'AES-GCM' : 'AES-CBC';
	await subtle.importKey('jwk', jwk, { name }, true, ['encrypt', 'decrypt']);
	return { kid: groupKey.slice(0, -344), sessionKeyExportedString };
};

describe('room key', () => {
	it.each([
		['v1', roomKeys.v1, 'A128CBC', 16],
		['v2', roomKeys.v2, 'A256GCM', 32]
	])('imports a %s E2EKey shared by the web client', async (_version, roomKey, algorithm, keyBytes) => {
		const room = await createRoom();

		const imported = await room.importRoomKey(roomKey.E2EKey, room.encryption.privateKey as string);

		expect(imported).toEqual({
			keyID: roomKey.keyID,
			sessionKeyExportedString: roomKey.sessionKeyExportedString,
			algorithm,
			roomKey: expect.any(ArrayBuffer)
		});
		expect(Buffer.from(imported.roomKey).toString('base64url')).toBe(JSON.parse(roomKey.sessionKeyExportedString).k);
		expect(imported.roomKey.byteLength).toBe(keyBytes);
	});

	it('rejects an E2EKey encrypted for another user', async () => {
		const room = await createRoom();
		const otherUser = await subtle.generateKey(
			{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['encrypt', 'decrypt']
		);
		const encrypted = await subtle.encrypt(
			{ name: 'RSA-OAEP' },
			otherUser.publicKey,
			Buffer.from(roomKeys.v2.sessionKeyExportedString)
		);

		await expect(
			room.importRoomKey(roomKeys.v2.keyID + Buffer.from(encrypted).toString('base64'), room.encryption.privateKey as string)
		).rejects.toThrow();
	});

	it('creates an A128CBC key with a sha256 key ID on a 7.0.0 workspace and shares it in a form the web client imports', async () => {
		mockGetState.mockReturnValue({ server: { version: '7.0.0' } });
		const room = await createRoom();

		await room.createNewRoomKey();
		const shared = await webClientImportGroupKey((await room.encryptRoomKeyForUser(user.publicKey)) as string);

		expect(room.algorithm).toBe('A128CBC');
		expect(room.roomKey.byteLength).toBe(16);
		expect(room.keyID).toBe((await sha256Hex(room.sessionKeyExportedString)).slice(0, 12));
		expect(shared).toEqual({ kid: room.keyID, sessionKeyExportedString: room.sessionKeyExportedString });
	});

	it('creates an A256GCM key with a UUID key ID on a 7.13.0 workspace and shares it in a form the web client imports', async () => {
		mockGetState.mockReturnValue({ server: { version: '7.13.0' } });
		const room = await createRoom();

		await room.createNewRoomKey();
		const shared = await webClientImportGroupKey((await room.encryptRoomKeyForUser(user.publicKey)) as string);

		expect(room.algorithm).toBe('A256GCM');
		expect(room.roomKey.byteLength).toBe(32);
		expect(room.keyID).toMatch(UUID);
		expect(shared).toEqual({ kid: room.keyID, sessionKeyExportedString: room.sessionKeyExportedString });
	});
});
