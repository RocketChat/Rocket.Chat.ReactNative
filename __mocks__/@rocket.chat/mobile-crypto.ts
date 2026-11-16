import { createPrivateKey, createPublicKey, randomUUID, type JsonWebKey as NodeJsonWebKey, type KeyObject } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import type { JWK } from '@rocket.chat/mobile-crypto';

const { subtle } = globalThis.crypto;

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const BASE64URL = /^[A-Za-z0-9_-]*={0,2}$/;
const HEX = /^([0-9a-fA-F]{2})*$/;

const fromBase64 = (base64: string) => {
	if (!BASE64.test(base64)) {
		throw new Error('Invalid base64');
	}
	return new Uint8Array(Buffer.from(base64, 'base64'));
};
const fromBase64Url = (base64Url: string) => {
	if (!BASE64URL.test(base64Url)) {
		throw new Error('Invalid base64url');
	}
	return new Uint8Array(Buffer.from(base64Url, 'base64url'));
};
const fromHex = (hex: string) => {
	if (!HEX.test(hex)) {
		throw new Error('Invalid hex');
	}
	return new Uint8Array(Buffer.from(hex, 'hex'));
};
const toBase64 = (bytes: ArrayBuffer | Uint8Array) => Buffer.from(new Uint8Array(bytes)).toString('base64');
const toHex = (bytes: ArrayBuffer | Uint8Array) => Buffer.from(new Uint8Array(bytes)).toString('hex');
const utf8 = (text: string) => new TextEncoder().encode(text);
const toFilePath = (path: string) => (path.startsWith('file://') ? decodeURIComponent(path.slice('file://'.length)) : path);
const randomValues = (size: number) => globalThis.crypto.getRandomValues(new Uint8Array(size));

const SHA_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
const PBKDF2_HASHES: Record<string, string> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA384: 'SHA-384', SHA512: 'SHA-512' };
const SIGN_HASHES: Record<string, string> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA384: 'SHA-384' };
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const GCM_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;
const RSA_OAEP: RsaHashedImportParams = { name: 'RSA-OAEP', hash: 'SHA-256' };

const digest = (data: Uint8Array, algorithm: string) => {
	if (!SHA_ALGORITHMS.includes(algorithm)) {
		throw new Error(`Unsupported algorithm: ${algorithm}`);
	}
	return subtle.digest(algorithm, data);
};

const importAesKey = (key: Uint8Array, name: 'AES-CBC' | 'AES-GCM' | 'AES-CTR') =>
	subtle.importKey('raw', key, { name }, false, ['encrypt', 'decrypt']);

const toWebCryptoKey = (keyObject: KeyObject, algorithm: RsaHashedImportParams, usage: KeyUsage) =>
	subtle.importKey('jwk', keyObject.export({ format: 'jwk' }) as JsonWebKey, algorithm, false, [usage]);

const toPem = (keyObject: KeyObject, type: 'spki' | 'pkcs8' | 'pkcs1') => keyObject.export({ format: 'pem', type }) as string;

const signParams = (hash?: string): RsaHashedImportParams => ({
	name: 'RSASSA-PKCS1-v1_5',
	hash: SIGN_HASHES[hash ?? 'SHA1'] ?? 'SHA-1'
});

const settle = <T>(produce: () => T) => new Promise<T>(resolve => resolve(produce()));

const nullOnError = async (operation: () => Promise<string | null>) => {
	try {
		return await operation();
	} catch {
		return null;
	}
};

export const shaBase64 = async (data: string, algorithm: string) => toBase64(await digest(fromBase64(data), algorithm));

export const shaUtf8 = async (data: string, algorithm: string) => toHex(await digest(utf8(data), algorithm));

export const pbkdf2Hash = async (pwdBase64: string, saltBase64: string, iterations: number, keyLen: number, hash: string) => {
	const hashName = PBKDF2_HASHES[hash];
	if (!hashName) {
		throw new Error(`Specified hash algorithm '${hash}' is not supported`);
	}
	const baseKey = await subtle.importKey('raw', fromBase64(pwdBase64), 'PBKDF2', false, ['deriveBits']);
	const bits = await subtle.deriveBits(
		{ name: 'PBKDF2', hash: hashName, salt: fromBase64(saltBase64), iterations },
		baseKey,
		keyLen * 8
	);
	return toBase64(bits);
};

export const hmac256 = async (data: string, key: string) => {
	const hmacKey = await subtle.importKey('raw', fromHex(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return toHex(await subtle.sign('HMAC', hmacKey, fromHex(data)));
};

export const aesEncrypt = async (dataBase64: string, keyHex: string, ivHex: string) => {
	if (!dataBase64) {
		return null;
	}
	const key = await importAesKey(fromHex(keyHex), 'AES-CBC');
	return toBase64(await subtle.encrypt({ name: 'AES-CBC', iv: fromHex(ivHex) }, key, fromBase64(dataBase64)));
};

export const aesDecrypt = async (dataBase64: string, keyHex: string, ivHex: string) => {
	if (!dataBase64) {
		return null;
	}
	const key = await importAesKey(fromHex(keyHex), 'AES-CBC');
	return toBase64(await subtle.decrypt({ name: 'AES-CBC', iv: fromHex(ivHex) }, key, fromBase64(dataBase64)));
};

const gcm = async (operation: 'encrypt' | 'decrypt', dataBase64: string, keyHex: string, ivHex: string) => {
	const keyBytes = fromHex(keyHex);
	const iv = fromHex(ivHex);
	if (!dataBase64 || keyBytes.length !== GCM_KEY_BYTES || iv.length !== GCM_IV_BYTES) {
		return null;
	}
	const key = await importAesKey(keyBytes, 'AES-GCM');
	return toBase64(await subtle[operation]({ name: 'AES-GCM', iv }, key, fromBase64(dataBase64)));
};

export const aesGcmEncrypt = (dataBase64: string, keyHex: string, ivHex: string) =>
	nullOnError(() => gcm('encrypt', dataBase64, keyHex, ivHex));

export const aesGcmDecrypt = (dataBase64: string, keyHex: string, ivHex: string) =>
	nullOnError(() => gcm('decrypt', dataBase64, keyHex, ivHex));

const aesCtrFile = async (filePath: string, base64UrlKey: string, base64Iv: string) => {
	const key = await importAesKey(fromBase64Url(base64UrlKey), 'AES-CTR');
	const data = await readFile(toFilePath(filePath));
	return new Uint8Array(await subtle.encrypt({ name: 'AES-CTR', counter: fromBase64(base64Iv), length: 128 }, key, data));
};

export const aesEncryptFile = async (filePath: string, base64UrlKey: string, base64Iv: string) => {
	const inputPath = toFilePath(filePath);
	const outputPath = join(dirname(inputPath), `processed_${randomUUID()}_${basename(inputPath)}`);
	await writeFile(outputPath, await aesCtrFile(filePath, base64UrlKey, base64Iv));
	return `file://${outputPath}`;
};

export const aesDecryptFile = async (filePath: string, base64UrlKey: string, base64Iv: string) => {
	await writeFile(toFilePath(filePath), await aesCtrFile(filePath, base64UrlKey, base64Iv));
	return filePath;
};

export const randomUuid = () => settle(() => randomUUID());

export const randomKey = (length: number) => settle(() => toHex(randomValues(length)));

export const randomBytes = (size: number) => settle(() => toBase64(randomValues(size)));

export const getRandomValues = (length: number) =>
	settle(() => Array.from(randomValues(length), byte => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join(''));

export const rsaGenerateKeys = async (keySize = 2048) => {
	const keyPair = await subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: keySize, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt']
	);
	const publicJwk = (await subtle.exportKey('jwk', keyPair.publicKey)) as NodeJsonWebKey;
	const privateJwk = (await subtle.exportKey('jwk', keyPair.privateKey)) as NodeJsonWebKey;
	return {
		public: toPem(createPublicKey({ key: publicJwk, format: 'jwk' }), 'spki'),
		private: toPem(createPrivateKey({ key: privateJwk, format: 'jwk' }), 'pkcs8')
	};
};

const encryptRsa = async (data: Uint8Array, publicKey: string) =>
	toBase64(await subtle.encrypt('RSA-OAEP', await toWebCryptoKey(createPublicKey(publicKey), RSA_OAEP, 'encrypt'), data));

const decryptRsa = async (encodedMessage: string, privateKey: string) =>
	subtle.decrypt('RSA-OAEP', await toWebCryptoKey(createPrivateKey(privateKey), RSA_OAEP, 'decrypt'), fromBase64(encodedMessage));

const signRsa = async (data: Uint8Array, privateKey: string, hash?: string) =>
	toBase64(
		await subtle.sign('RSASSA-PKCS1-v1_5', await toWebCryptoKey(createPrivateKey(privateKey), signParams(hash), 'sign'), data)
	);

const verifyRsa = async (signature: string, data: Uint8Array, publicKey: string, hash?: string) =>
	subtle.verify(
		'RSASSA-PKCS1-v1_5',
		await toWebCryptoKey(createPublicKey(publicKey), signParams(hash), 'verify'),
		fromBase64(signature),
		data
	);

export const rsaEncrypt = (message: string, publicKey: string) => encryptRsa(utf8(message), publicKey);

export const rsaEncrypt64 = (message: string, publicKey: string) => encryptRsa(fromBase64(message), publicKey);

export const rsaDecrypt = async (encodedMessage: string, privateKey: string) =>
	new TextDecoder().decode(await decryptRsa(encodedMessage, privateKey));

export const rsaDecrypt64 = async (encodedMessage: string, privateKey: string) =>
	toBase64(await decryptRsa(encodedMessage, privateKey));

export const rsaSign = (message: string, privateKey: string, hash?: string) => signRsa(utf8(message), privateKey, hash);

export const rsaSign64 = (message: string, privateKey: string, hash?: string) => signRsa(fromBase64(message), privateKey, hash);

export const rsaVerify = (signature: string, message: string, publicKey: string, hash?: string) =>
	verifyRsa(signature, utf8(message), publicKey, hash);

export const rsaVerify64 = (signature: string, message: string, publicKey: string, hash?: string) =>
	verifyRsa(signature, fromBase64(message), publicKey, hash);

const jwkToPem = (jwk: JWK) => {
	const { kty, n, e, d, p, q, dp, dq, qi } = jwk;
	if (d) {
		return toPem(createPrivateKey({ key: { kty, n, e, d, p, q, dp, dq, qi }, format: 'jwk' }), 'pkcs1');
	}
	return toPem(createPublicKey({ key: { kty, n, e }, format: 'jwk' }), 'pkcs1');
};

const pemToJwk = (pem: string): JWK => {
	if (pem.includes('PUBLIC')) {
		const { n, e } = createPublicKey(pem).export({ format: 'jwk' }) as Required<NodeJsonWebKey>;
		return { n, e, kty: 'RSA', alg: 'RSA-OAEP-256', ext: true, key_ops: ['encrypt'] };
	}
	const { n, e, d, p, q, dp, dq, qi } = createPrivateKey(pem).export({ format: 'jwk' }) as Required<NodeJsonWebKey>;
	return { n, e, d, p, q, dp, dq, qi, kty: 'RSA', alg: 'RSA-OAEP-256', ext: true, key_ops: ['decrypt'] };
};

export const rsaImportKey = (jwk: JWK) => settle(() => jwkToPem(jwk));

export const rsaExportKey = (pem: string) => settle(() => pemToJwk(pem));

export const rsaPemToJwk = rsaExportKey;

export const calculateFileChecksum = async (filePath: string) =>
	toHex(await subtle.digest('SHA-256', await readFile(toFilePath(filePath))));
