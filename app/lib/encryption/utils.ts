import ByteBuffer from 'bytebuffer';
import { aesDecryptFile, aesEncryptFile, getRandomValues, randomBytes } from '@rocket.chat/mobile-crypto';
import { decode as base64Decode, encode as base64Encode, fromUint8Array } from 'js-base64';

import { compareServerVersion } from '../methods/helpers';
import { fromByteArray, toByteArray } from './helpers/base64-js';
import * as hexLite from './helpers/hex-lite';
import { TSubscriptionModel } from '../../definitions';
import { store } from '../store/auxStore';

const BASE64URI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const convertUtf8ToArrayBuffer = (utf8: string) => {
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

export const convertArrayBufferToHex = hexLite.fromBuffer;

// @ts-ignore
export const b64ToBuffer = (base64: string): ArrayBuffer => toByteArray(base64).buffer;
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

// Helper function to convert base64 to hex
// export const base64ToHex = (base64: string): string => {
// 	const binaryString = base64Decode(base64);
// 	let hex = '';
// 	for (let i = 0; i < binaryString.length; i++) {
// 		const hexChar = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
// 		hex += hexChar;
// 	}
// 	return hex;
// };
export const base64ToHex = (base64: string): string => {
	console.log(`🔧 Converting base64 to hex: "${base64}" (${base64.length} chars)`);

	// Ensure the base64 string has proper padding
	let paddedBase64 = base64;
	while (paddedBase64.length % 4 !== 0) {
		paddedBase64 += '=';
	}

	if (paddedBase64 !== base64) {
		console.log(`🔧 Added padding: "${paddedBase64}" (${paddedBase64.length} chars)`);
	}

	try {
		// Try using atob with proper padding
		const binaryStr = atob(paddedBase64);
		const bytes = new Uint8Array(binaryStr.length);
		for (let i = 0; i < binaryStr.length; i++) {
			bytes[i] = binaryStr.charCodeAt(i);
		}

		const hex = Array.from(bytes)
			.map(byte => byte.toString(16).padStart(2, '0'))
			.join('');

		console.log(`🔧 base64ToHex (atob): binary=${binaryStr.length} bytes, hex=${hex.length} chars`);

		// Log the conversion result (don't warn since this function is used for both keys and IVs)
		console.log(`✅ Converted to ${hex.length / 2} bytes (${hex.length} hex chars)`);
		if (hex.length === 64) {
			console.log(`✅ Valid AES-256 key size (32 bytes)`);
		} else if (hex.length === 32) {
			console.log(`✅ Valid AES IV size (16 bytes)`);
		}

		return hex;
	} catch (e) {
		console.log(`❌ atob failed: ${e}, trying js-base64`);
		// Fallback to js-base64
		const binaryString = base64Decode(paddedBase64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		const hex = Array.from(bytes)
			.map(byte => byte.toString(16).padStart(2, '0'))
			.join('');

		console.log(`🔧 base64ToHex (js-base64): binary=${binaryString.length} bytes, hex=${hex.length} chars`);
		return hex;
	}
};

// SimpleCrypto.utils.convertArrayBufferToUtf8 is not working with unicode emoji
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

export const convertArrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => fromByteArray(new Uint8Array(arrayBuffer));

// Helper function to split IV and encrypted data (equivalent to splitVectorData)
export const splitVectorDataBase64 = (combined: string): [string, string] => {
	const parsed = JSON.parse(base64Decode(combined));
	console.log('parsed', parsed);
	return [parsed.iv, parsed.data];
};

export const joinVectorData = (vector: ArrayBuffer, data: ArrayBuffer): ArrayBufferLike => {
	const output = new Uint8Array(vector.byteLength + data.byteLength);
	output.set(new Uint8Array(vector), 0);
	output.set(new Uint8Array(data), vector.byteLength);
	return output.buffer;
};

// Helper function to join IV and encrypted data (equivalent to joinVectorData)
export const joinVectorDataBase64 = (iv: string, data: string): string => {
	// Create a combined structure - in a real implementation, you might use a different format
	const combined = {
		iv,
		data
	};
	return base64Encode(JSON.stringify(combined));
};

export const toString = (thing: string | ByteBuffer | Buffer | ArrayBuffer | Uint8Array): string | ByteBuffer => {
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

export const randomPassword = async (): Promise<string> => {
	const random = await Promise.all(Array.from({ length: 4 }, () => getRandomValues(3)));
	return `${random[0]}-${random[1]}-${random[2]}-${random[3]}`;
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
