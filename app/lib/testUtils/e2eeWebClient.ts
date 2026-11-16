import { type IMessage } from '~/definitions';

const { subtle } = globalThis.crypto;

const ENCRYPTED_KEY_LENGTH = 344;

export const webClientDecryptText = async (sessionKeyExportedString: string, content: IMessage['content']) => {
	const jwk = JSON.parse(sessionKeyExportedString);
	const name = jwk.alg === 'A256GCM' ? 'AES-GCM' : 'AES-CBC';
	const key = await subtle.importKey('jwk', jwk, { name }, false, ['decrypt']);
	const payload =
		content?.algorithm === 'rc.v2.aes-sha2'
			? { iv: Buffer.from(content.iv, 'base64'), ciphertext: Buffer.from(content.ciphertext, 'base64') }
			: {
					iv: Buffer.from(content?.ciphertext.slice(12) ?? '', 'base64').subarray(0, 16),
					ciphertext: Buffer.from(content?.ciphertext.slice(12) ?? '', 'base64').subarray(16)
				};
	const decrypted = await subtle.decrypt({ name, iv: payload.iv }, key, payload.ciphertext);
	return JSON.parse(new TextDecoder().decode(decrypted));
};

export const webClientDecryptGroupKey = async (privateKey: CryptoKey, groupKey: string) => {
	const decrypted = await subtle.decrypt(
		{ name: 'RSA-OAEP' },
		privateKey,
		Buffer.from(groupKey.slice(-ENCRYPTED_KEY_LENGTH), 'base64')
	);
	return {
		keyID: groupKey.slice(0, -ENCRYPTED_KEY_LENGTH),
		sessionKey: JSON.parse(Buffer.from(decrypted).toString('latin1'))
	};
};

export const webClientDecryptFile = async (encrypted: Buffer, { key, iv }: { key: JsonWebKey; iv: string }) => {
	const cryptoKey = await subtle.importKey('jwk', key, { name: 'AES-CTR' }, false, ['decrypt']);
	const decrypted = await subtle.decrypt(
		{ name: 'AES-CTR', counter: Buffer.from(iv, 'base64'), length: 64 },
		cryptoKey,
		new Uint8Array(encrypted)
	);
	return Buffer.from(decrypted);
};

export const generateMemberKeys = async () => {
	const keys = await subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt']
	);
	return { privateKey: keys.privateKey, publicKey: JSON.stringify(await subtle.exportKey('jwk', keys.publicKey)) };
};
