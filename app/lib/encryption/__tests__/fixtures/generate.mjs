// Golden fixtures produced the way the Rocket.Chat web client produces them, never with the mobile code.
// v2 formats: https://github.com/RocketChat/Rocket.Chat/tree/63c9dd192af243f6bc70848b0a8e788a5d4ddab8/apps/meteor/client/lib/e2ee
// v1 formats: https://github.com/RocketChat/Rocket.Chat/tree/7.0.0/apps/meteor/app/e2e/client
import { writeFile } from 'node:fs/promises';

import EJSON from 'ejson';

const { subtle } = globalThis.crypto;

const USER_ID = 'web-fixture-user';
const PASSWORD = 'correct horse battery staple';
const PLAINTEXT_MESSAGE = { msg: 'Olá from the web client 🔐' };
const PLAINTEXT_FILE = 'Plain file bytes written by the web client.\n'.repeat(4);

const RSA_OAEP = {
	name: 'RSA-OAEP',
	modulusLength: 2048,
	publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
	hash: { name: 'SHA-256' }
};

const base64 = bytes => Buffer.from(new Uint8Array(bytes)).toString('base64');
const binaryDecode = text => new Uint8Array(Buffer.from(text, 'latin1'));
const randomValues = size => globalThis.crypto.getRandomValues(new Uint8Array(size));
const join = (vector, data) => new Uint8Array([...vector, ...new Uint8Array(data)]);
const sha256Hex = async data =>
	Array.from(new Uint8Array(await subtle.digest('SHA-256', data)))
		.map(byte => byte.toString(16).padStart(2, '0'))
		.join('');

const deriveMasterKey = async (password, salt, iterations, name) => {
	const baseKey = await subtle.importKey('raw', binaryDecode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
	const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: binaryDecode(salt), iterations }, baseKey, 256);
	return subtle.importKey('raw', bits, { name, length: 256 }, false, ['encrypt', 'decrypt']);
};

// 7.0.0 rocketchat.e2e.ts encodePrivateKey + helper.js deriveKey
const encodePrivateKeyV1 = async privateKey => {
	const masterKey = await deriveMasterKey(PASSWORD, USER_ID, 1000, 'AES-CBC');
	const vector = randomValues(16);
	const encrypted = await subtle.encrypt({ name: 'AES-CBC', iv: vector }, masterKey, binaryDecode(privateKey));
	return EJSON.stringify(join(vector, encrypted));
};

// keychain.ts Keychain.encryptKey
const encodePrivateKeyV2 = async privateKey => {
	const salt = `v2:${USER_ID}:${globalThis.crypto.randomUUID()}`;
	const iterations = 100_000;
	const masterKey = await deriveMasterKey(PASSWORD, salt, iterations, 'AES-GCM');
	const iv = randomValues(12);
	const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, masterKey, binaryDecode(privateKey));
	return JSON.stringify({ iv: base64(iv), ciphertext: base64(ciphertext), salt, iterations });
};

// 7.0.0 rocketchat.e2e.room.js createNewGroupKey + encryptGroupKeyForParticipant
const createRoomKeyV1 = async publicKey => {
	const key = await subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
	const sessionKeyExportedString = JSON.stringify(await subtle.exportKey('jwk', key));
	const keyID = (await sha256Hex(new TextEncoder().encode(sessionKeyExportedString))).slice(0, 12);
	const encryptedUserKey = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, binaryDecode(sessionKeyExportedString));
	return { key, keyID, sessionKeyExportedString, E2EKey: keyID + base64(encryptedUserKey) };
};

// rocketchat.e2e.room.ts createNewGroupKey + encryptGroupKeyForParticipant (PrefixedBase64)
const createRoomKeyV2 = async publicKey => {
	const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	const sessionKeyExportedString = JSON.stringify(await subtle.exportKey('jwk', key));
	const keyID = globalThis.crypto.randomUUID();
	const encryptedUserKey = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, binaryDecode(sessionKeyExportedString));
	return { key, keyID, sessionKeyExportedString, E2EKey: keyID + base64(encryptedUserKey) };
};

// 7.0.0 rocketchat.e2e.room.js encryptMessageContent + encryptText
const encryptMessageV1 = async ({ key, keyID }, content) => {
	const vector = randomValues(16);
	const data = new TextEncoder().encode(EJSON.stringify(content));
	const encrypted = await subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);
	return { algorithm: 'rc.v1.aes-sha2', ciphertext: keyID + base64(join(vector, encrypted)) };
};

// rocketchat.e2e.room.ts encryptMessageContent + encryptText
const encryptMessageV2 = async ({ key, keyID }, content) => {
	const iv = randomValues(12);
	const data = new TextEncoder().encode(EJSON.stringify(content));
	const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
	return { algorithm: 'rc.v2.aes-sha2', kid: keyID, iv: base64(iv), ciphertext: base64(ciphertext) };
};

// rocketchat.e2e.room.ts encryptFile + helper.ts encryptAESCTR / generateAESCTRKey / sha256HashFromArrayBuffer
const encryptFile = async plaintext => {
	const hash = await sha256Hex(plaintext);
	const vector = randomValues(16);
	const key = await subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, ['encrypt', 'decrypt']);
	const encrypted = await subtle.encrypt({ name: 'AES-CTR', counter: vector, length: 64 }, key, plaintext);
	return { key: await subtle.exportKey('jwk', key), iv: base64(vector), hash, encrypted: base64(encrypted) };
};

const writeFixture = (name, fixture) =>
	writeFile(new URL(`./${name}.json`, import.meta.url), `${JSON.stringify(fixture, null, '\t')}\n`);

const keyPair = await subtle.generateKey(RSA_OAEP, true, ['encrypt', 'decrypt']);
const publicKey = JSON.stringify(await subtle.exportKey('jwk', keyPair.publicKey));
const privateKey = JSON.stringify(await subtle.exportKey('jwk', keyPair.privateKey));

const roomKeyV1 = await createRoomKeyV1(keyPair.publicKey);
const roomKeyV2 = await createRoomKeyV2(keyPair.publicKey);
const toRoomKeyFixture = ({ keyID, sessionKeyExportedString, E2EKey }) => ({ keyID, sessionKeyExportedString, E2EKey });

const plaintextFile = new TextEncoder().encode(PLAINTEXT_FILE);

await writeFixture('user', {
	userId: USER_ID,
	password: PASSWORD,
	publicKey,
	privateKey,
	encodedPrivateKeyV1: await encodePrivateKeyV1(privateKey),
	encodedPrivateKeyV2: await encodePrivateKeyV2(privateKey)
});
await writeFixture('roomKeys', { v1: toRoomKeyFixture(roomKeyV1), v2: toRoomKeyFixture(roomKeyV2) });
await writeFixture('messages', {
	plaintext: PLAINTEXT_MESSAGE,
	v1: await encryptMessageV1(roomKeyV1, PLAINTEXT_MESSAGE),
	v2: await encryptMessageV2(roomKeyV2, PLAINTEXT_MESSAGE)
});
await writeFixture('file', { plaintext: base64(plaintextFile), ...(await encryptFile(plaintextFile)) });
