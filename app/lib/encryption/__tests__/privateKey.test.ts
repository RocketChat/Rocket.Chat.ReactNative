import Encryption from '../encryption';
import user from './fixtures/user.json';

const mockGetState = jest.fn();
jest.mock('../../store/auxStore', () => ({
	store: { getState: () => mockGetState() }
}));

const WRONG_PASSWORD = 'not the password';

const setServerVersion = (version: string) => mockGetState.mockReturnValue({ server: { version }, settings: {} });

const latin1 = (text: string) => new Uint8Array(Buffer.from(text, 'latin1'));
const fromBase64 = (base64: string) => new Uint8Array(Buffer.from(base64, 'base64'));

const webClientDecryptKey = async (encodedPrivateKey: string, password: string, userId: string) => {
	const stored = JSON.parse(encodedPrivateKey);
	const binary = stored.$binary ? fromBase64(stored.$binary) : null;
	const iv = binary ? binary.slice(0, 16) : fromBase64(stored.iv);
	const ciphertext = binary ? binary.slice(16) : fromBase64(stored.ciphertext);
	const salt = binary ? userId : stored.salt;
	const iterations = binary ? 1000 : stored.iterations;
	const name = iv.length === 16 ? 'AES-CBC' : 'AES-GCM';
	const { subtle } = globalThis.crypto;
	const baseKey = await subtle.importKey('raw', latin1(password), 'PBKDF2', false, ['deriveBits']);
	const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: latin1(salt), iterations }, baseKey, 256);
	const key = await subtle.importKey('raw', bits, { name, length: 256 }, false, ['decrypt']);
	return Buffer.from(await subtle.decrypt({ name, iv }, key, ciphertext)).toString('latin1');
};

describe('private key encoding', () => {
	it('encodes in the v1 format below 7.13.0, readable by the web client and by itself', async () => {
		setServerVersion('7.12.0');

		const encoded = await Encryption.encodePrivateKey(user.privateKey, user.password, user.userId);

		expect(Object.keys(JSON.parse(encoded))).toEqual(['$binary']);
		await expect(webClientDecryptKey(encoded, user.password, user.userId)).resolves.toBe(user.privateKey);
		await expect(Encryption.decodePrivateKey(encoded, user.password, user.userId)).resolves.toBe(user.privateKey);
	});

	it('encodes in the v2 format from 7.13.0, readable by the web client and by itself', async () => {
		setServerVersion('7.13.0');

		const encoded = await Encryption.encodePrivateKey(user.privateKey, user.password, user.userId);
		const { iv, ciphertext, salt, iterations } = JSON.parse(encoded);

		expect(Buffer.from(iv, 'base64')).toHaveLength(12);
		expect(ciphertext).toEqual(expect.any(String));
		expect(salt.startsWith(`v2:${user.userId}:`)).toBe(true);
		expect(iterations).toBe(100000);
		await expect(webClientDecryptKey(encoded, user.password, user.userId)).resolves.toBe(user.privateKey);
		await expect(Encryption.decodePrivateKey(encoded, user.password, user.userId)).resolves.toBe(user.privateKey);
	});

	it.each([
		['v1', user.encodedPrivateKeyV1],
		['v2', user.encodedPrivateKeyV2]
	])('decodes a %s private key encoded by the web client', async (_version, encodedPrivateKey) => {
		await expect(Encryption.decodePrivateKey(encodedPrivateKey, user.password, user.userId)).resolves.toBe(user.privateKey);
	});

	it.each([
		['v1', user.encodedPrivateKeyV1],
		['v2', user.encodedPrivateKeyV2]
	])('rejects a %s private key with the wrong password', async (_version, encodedPrivateKey) => {
		await expect(Encryption.decodePrivateKey(encodedPrivateKey, WRONG_PASSWORD, user.userId)).rejects.toThrow();
	});
});
