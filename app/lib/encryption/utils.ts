import ByteBuffer from 'bytebuffer';
import { aesDecryptFile, aesEncryptFile, randomBytes } from '@rocket.chat/mobile-crypto';

import { compareServerVersion } from '../methods/helpers';
import { fromByteArray, toByteArray } from './helpers/base64-js';
import * as hexLite from './helpers/hex-lite';
import { type TSubscriptionModel } from '../../definitions';
import { store } from '../store/auxStore';

const BASE64URI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const bufferToHex = hexLite.fromBuffer;

// @ts-ignore
export const b64ToBuffer = (base64: string): ArrayBuffer => toByteArray(base64).buffer;

export const bufferToB64 = (arrayBuffer: ArrayBuffer): string => fromByteArray(new Uint8Array(arrayBuffer));

// ArrayBuffer -> Base64 URI Safe
// https://github.com/herrjemand/Base64URL-ArrayBuffer/blob/master/lib/base64url-arraybuffer.js
export const bufferToB64URI = (buffer: ArrayBuffer): string => {
	const uintArray = new Uint8Array(buffer);
	const len = uintArray.length;
	let base64 = '';

	for (let i = 0; i < len; i += 3) {
		base64 += BASE64URI[uintArray[i] >> 2];
		base64 += BASE64URI[((uintArray[i] & 3) << 4) | (uintArray[i + 1] >> 4)];
		base64 += BASE64URI[((uintArray[i + 1] & 15) << 2) | (uintArray[i + 2] >> 6)];
		base64 += BASE64URI[uintArray[i + 2] & 63];
	}

	if (len % 3 === 2) {
		base64 = base64.substring(0, base64.length - 1);
	} else if (len % 3 === 1) {
		base64 = base64.substring(0, base64.length - 2);
	}

	return base64;
};

export const utf8ToBuffer = (utf8: string): ArrayBuffer => {
	const bytes = [];

	let i = 0;
	utf8 = encodeURI(utf8);
	while (i < utf8.length) {
		const byte = utf8.charCodeAt(i++);
		if (byte === 37) {
			bytes.push(parseInt(utf8.substr(i, 2), 16));
			i += 2;
		} else {
			bytes.push(byte);
		}
	}

	const array = new Uint8Array(bytes);
	return array.buffer;
};

export const bufferToUtf8 = (buffer: ArrayBuffer): string => {
	const uintArray = new Uint8Array(buffer) as number[] & Uint8Array;
	const encodedString = String.fromCharCode.apply(null, uintArray);
	return decodeURIComponent(escape(encodedString));
};

export const splitVectorData = (text: ArrayBuffer): ArrayBuffer[] => {
	const vector = text.slice(0, 16);
	const data = text.slice(16);
	return [vector, data];
};

export const joinVectorData = (vector: ArrayBuffer, data: ArrayBuffer): ArrayBuffer => {
	const output = new Uint8Array(vector.byteLength + data.byteLength);
	output.set(new Uint8Array(vector), 0);
	output.set(new Uint8Array(data), vector.byteLength);
	return output.buffer;
};

export const toString = (thing: string | ByteBuffer | Buffer | ArrayBuffer | Uint8Array): string => {
	if (typeof thing === 'string') {
		return thing;
	}
	// @ts-ignore
	return new ByteBuffer.wrap(thing).toString('binary');
};

// https://github.com/RocketChat/Rocket.Chat/blob/b94db45cab297a3bcbafca4d135d83c898222380/apps/meteor/app/mentions/lib/MentionsParser.ts#L50
const userMentionRegex = (pattern: string) => new RegExp(`(^|\\s|>)@(${pattern}(@(${pattern}))?(:([0-9a-zA-Z-_.]+))?)`, 'gm');
const channelMentionRegex = (pattern: string) => new RegExp(`(^|\\s|>)#(${pattern}(@(${pattern}))?)`, 'gm');

export const getE2EEMentions = (message?: string) => {
	const e2eEnabledMentions = store.getState().settings.E2E_Enabled_Mentions;
	if (!e2eEnabledMentions || !message) {
		return undefined;
	}
	const utf8UserNamesValidation = store.getState().settings.UTF8_User_Names_Validation as string;

	return {
		e2eUserMentions: (message.match(userMentionRegex(utf8UserNamesValidation)) || []).map(match => match.trim()),
		e2eChannelMentions: (message.match(channelMentionRegex(utf8UserNamesValidation)) || []).map(match => match.trim())
	};
};

export const generateAESCTRKey = () => randomBytes(32);

interface IExportedKey {
	kty: string;
	alg: string;
	k: string;
	ext: boolean;
	key_ops: string[];
}

export const exportAESCTR = (key: ArrayBuffer): IExportedKey => {
	// Web Crypto format of a Secret Key
	const exportedKey = {
		// Type of Secret Key
		kty: 'oct',
		// Algorithm
		alg: 'A256CTR',
		// Base64URI encoded array of bytes
		k: bufferToB64URI(key),
		// Specific Web Crypto properties
		ext: true,
		key_ops: ['encrypt', 'decrypt']
	};

	return exportedKey;
};

export const encryptAESCTR = (path: string, key: string, vector: string): Promise<string> => aesEncryptFile(path, key, vector);

export const decryptAESCTR = (path: string, key: string, vector: string): Promise<string> => aesDecryptFile(path, key, vector);

// Missing room encryption key
export const isMissingRoomE2EEKey = ({
	encryptionEnabled,
	roomEncrypted,
	E2EKey
}: {
	encryptionEnabled: boolean;
	roomEncrypted: TSubscriptionModel['encrypted'];
	E2EKey: TSubscriptionModel['E2EKey'];
}): boolean => {
	const serverVersion = store.getState().server.version;
	const e2eeEnabled = store.getState().settings.E2E_Enable;
	if (!e2eeEnabled) {
		return false;
	}
	if (compareServerVersion(serverVersion, 'lowerThan', '6.10.0')) {
		return false;
	}
	return (encryptionEnabled && roomEncrypted && !E2EKey) ?? false;
};

// Encrypted room, but user session is not encrypted
export const isE2EEDisabledEncryptedRoom = ({
	encryptionEnabled,
	roomEncrypted
}: {
	encryptionEnabled: boolean;
	roomEncrypted: TSubscriptionModel['encrypted'];
}): boolean => {
	const serverVersion = store.getState().server.version;
	const e2eeEnabled = store.getState().settings.E2E_Enable;
	if (!e2eeEnabled) {
		return false;
	}
	if (compareServerVersion(serverVersion, 'lowerThan', '6.10.0')) {
		return false;
	}
	return (!encryptionEnabled && roomEncrypted) ?? false;
};

export const hasE2EEWarning = ({
	encryptionEnabled,
	roomEncrypted,
	E2EKey
}: {
	encryptionEnabled: boolean;
	roomEncrypted: TSubscriptionModel['encrypted'];
	E2EKey: TSubscriptionModel['E2EKey'];
}): boolean => {
	if (isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted, E2EKey })) {
		return true;
	}
	if (isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted })) {
		return true;
	}
	return false;
};

// https://github.com/RocketChat/Rocket.Chat/blob/7a57f3452fd26a603948b70af8f728953afee53f/apps/meteor/lib/utils/getFileExtension.ts#L1
// A 256-byte array always encodes to 344 characters in Base64.
const DECODED_LENGTH = 256;
// ((4 * 256 / 3) + 3) & ~3 = 344
const ENCODED_LENGTH = 344;

export const decodePrefixedBase64 = (input: string): [prefix: string, data: ArrayBuffer] => {
	// 1. Validate the input string length
	if (input.length < ENCODED_LENGTH) {
		throw new RangeError('Invalid input length.');
	}

	// 2. Split the string into its two parts
	const prefix = input.slice(0, -ENCODED_LENGTH);
	const base64Data = input.slice(-ENCODED_LENGTH);

	// 3. Decode the Base64 string
	const bytes = b64ToBuffer(base64Data);

	if (bytes.byteLength !== DECODED_LENGTH) {
		// This is a sanity check in case the Base64 string was valid but didn't decode to 256 bytes.
		throw new RangeError('Decoded data length is too short.');
	}

	return [prefix, bytes];
};

export const encodePrefixedBase64 = (prefix: string, data: ArrayBuffer): string => {
	// 1. Validate the input data length
	if (data.byteLength !== DECODED_LENGTH) {
		throw new RangeError(`Input data length is ${data.byteLength}, but expected ${DECODED_LENGTH} bytes.`);
	}

	// 2. Convert the byte array to base64
	const base64Data = bufferToB64(data);

	if (base64Data.length !== ENCODED_LENGTH) {
		// This is a sanity check in case something went wrong during encoding.
		throw new RangeError(`Encoded Base64 length is ${base64Data.length}, but expected ${ENCODED_LENGTH} characters.`);
	}

	// 3. Concatenate the prefix and the Base64 string
	return prefix + base64Data;
};

export const parsePrivateKey = (
	privateKey: string,
	userId: string
): { iv: ArrayBuffer; ciphertext: ArrayBuffer; salt: string; iterations: number; version: 'v1' | 'v2' } => {
	const json: unknown = JSON.parse(privateKey);
	if (typeof json !== 'object' || json === null) {
		throw new TypeError('Invalid private key format');
	}

	const salt = 'salt' in json && typeof json.salt === 'string' ? json.salt : userId;

	if (
		'iv' in json &&
		'ciphertext' in json &&
		typeof json.iv === 'string' &&
		typeof json.ciphertext === 'string' &&
		'iterations' in json &&
		typeof json.iterations === 'number'
	) {
		// v2: { iv: base64, ciphertext: base64, salt: string }
		return {
			iv: b64ToBuffer(json.iv),
			ciphertext: b64ToBuffer(json.ciphertext),
			salt,
			iterations: json.iterations,
			version: 'v2'
		};
	}

	if ('$binary' in json && typeof json.$binary === 'string') {
		// v1: { $binary: base64(iv[16] + ciphertext) }
		const binary = b64ToBuffer(json.$binary);
		const [iv, ciphertext] = splitVectorData(binary);
		return { iv, ciphertext, salt, iterations: 1000, version: 'v1' };
	}

	throw new TypeError('Invalid private key format');
};

export const getFileExtension = (fileName?: string): string => {
	if (!fileName) {
		return 'file';
	}

	const arr = fileName.split('.');

	if (arr.length < 2 || (arr[0] === '' && arr.length === 2)) {
		return 'file';
	}

	return arr.pop()?.toLocaleUpperCase() || 'file';
};

/**
 * Generates 12 uniformly random words from the word list.
 *
 * @remarks
 * Uses {@link https://en.wikipedia.org/wiki/Rejection_sampling | rejection sampling} to ensure uniform distribution.
 *
 * @returns A space-separated passphrase.
 */
export async function generatePassphrase() {
	const { wordlist } = await import('./wordList');

	const WORD_COUNT = 12;
	const MAX_UINT32 = 0xffffffff;
	const range = wordlist.length; // 2048
	const rejectionThreshold = Math.floor(MAX_UINT32 / range) * range;

	const words: string[] = [];

	for (let i = 0; i < WORD_COUNT; i++) {
		let v: number;
		do {
			// eslint-disable-next-line no-await-in-loop
			const randomBase64 = await randomBytes(4);
			const randomBuffer = b64ToBuffer(randomBase64);
			const randomArray = new Uint8Array(randomBuffer);

			// Combine 4 bytes into 32-bit big-endian integer
			v = (randomArray[0] << 24) | (randomArray[1] << 16) | (randomArray[2] << 8) | randomArray[3];

			// Convert to unsigned 32-bit (JavaScript numbers are signed)
			v >>>= 0;
		} while (v >= rejectionThreshold);

		words.push(wordlist[v % range]);
	}

	return words.join(' ');
}
