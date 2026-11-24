import { aesCbcDecrypt, aesGcmDecrypt, randomBytes, type AESGCMCiphertext, type AESKey } from '@rocket.chat/mobile-crypto';

import { compareServerVersion } from '../methods/helpers/compareServerVersion';
import { fromByteArray, toByteArray } from './helpers/base64-js';
import { type TSubscriptionModel } from '~/definitions/ISubscription';
import { store } from '../store/auxStore';

// @ts-ignore
export const b64ToBuffer = (base64: string): ArrayBuffer => toByteArray(base64).buffer;

export const bufferToB64 = (arrayBuffer: ArrayBuffer): string => fromByteArray(new Uint8Array(arrayBuffer));

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

interface IExportedKey {
	kty: string;
	alg: string;
	k: string;
	ext: boolean;
	key_ops: string[];
}

export const exportAESCTR = (key: string): IExportedKey => {
	// Web Crypto format of a Secret Key
	const exportedKey = {
		// Type of Secret Key
		kty: 'oct',
		// Algorithm
		alg: 'A256CTR',
		// Base64URI encoded array of bytes
		k: key,
		// Specific Web Crypto properties
		ext: true,
		key_ops: ['encrypt', 'decrypt']
	};

	return exportedKey;
};

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

export const decodePrefixedBase64 = (input: string): [prefix: string, base64Data: string] => {
	if (input.length < ENCODED_LENGTH) {
		throw new RangeError('Invalid input length.');
	}

	const prefix = input.slice(0, -ENCODED_LENGTH);
	const base64Data = input.slice(-ENCODED_LENGTH);

	if (b64ToBuffer(base64Data).byteLength !== DECODED_LENGTH) {
		throw new RangeError('Decoded data length is too short.');
	}

	return [prefix, base64Data];
};

export const encodePrefixedBase64 = (prefix: string, base64Data: string): string => {
	const decodedLength = b64ToBuffer(base64Data).byteLength;
	if (decodedLength !== DECODED_LENGTH) {
		throw new RangeError(`Input data length is ${decodedLength}, but expected ${DECODED_LENGTH} bytes.`);
	}

	if (base64Data.length !== ENCODED_LENGTH) {
		throw new RangeError(`Encoded Base64 length is ${base64Data.length}, but expected ${ENCODED_LENGTH} characters.`);
	}

	return prefix + base64Data;
};

type TParsedPrivateKey = { salt: string; iterations: number; encrypted: AESGCMCiphertext | string };

export const parsePrivateKey = (privateKey: string, userId: string): TParsedPrivateKey => {
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
		return { salt, iterations: json.iterations, encrypted: { iv: json.iv, ciphertext: json.ciphertext } };
	}

	if ('$binary' in json && typeof json.$binary === 'string') {
		return { salt, iterations: 1000, encrypted: json.$binary };
	}

	throw new TypeError('Invalid private key format');
};

export const aesDecrypt = (key: AESKey, encrypted: AESGCMCiphertext | string): Promise<string> =>
	typeof encrypted === 'string' ? aesCbcDecrypt(key, encrypted) : aesGcmDecrypt(key, encrypted);

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
			const randomArray = new Uint8Array(randomBytes(4));

			// Combine 4 bytes into 32-bit big-endian integer
			v = (randomArray[0] << 24) | (randomArray[1] << 16) | (randomArray[2] << 8) | randomArray[3];

			// Convert to unsigned 32-bit (JavaScript numbers are signed)
			v >>>= 0;
		} while (v >= rejectionThreshold);

		words.push(wordlist[v % range]);
	}

	return words.join(' ');
}
