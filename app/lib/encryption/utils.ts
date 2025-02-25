import ByteBuffer from 'bytebuffer';
import SimpleCrypto from 'react-native-simple-crypto';

import { compareServerVersion } from '../methods/helpers';
import { fromByteArray, toByteArray } from './helpers/base64-js';
import { TSubscriptionModel } from '../../definitions';
import { store } from '../store/auxStore';

const BASE64URI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// @ts-ignore
export const b64ToBuffer = (base64: string): ArrayBuffer => toByteArray(base64).buffer;
export const utf8ToBuffer = SimpleCrypto.utils.convertUtf8ToArrayBuffer;
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

export const joinVectorData = (vector: ArrayBuffer, data: ArrayBuffer): ArrayBufferLike => {
	const output = new Uint8Array(vector.byteLength + data.byteLength);
	output.set(new Uint8Array(vector), 0);
	output.set(new Uint8Array(data), vector.byteLength);
	return output.buffer;
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
	const random = await Promise.all(Array.from({ length: 4 }, () => SimpleCrypto.utils.getRandomValues(3)));
	return `${random[0]}-${random[1]}-${random[2]}-${random[3]}`;
};

export const generateAESCTRKey = () => SimpleCrypto.utils.randomBytes(32);

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

export const encryptAESCTR = (path: string, key: string, vector: string): Promise<string> =>
	SimpleCrypto.AES.encryptFile(path, key, vector);

export const decryptAESCTR = (path: string, key: string, vector: string): Promise<string> =>
	SimpleCrypto.AES.decryptFile(path, key, vector);

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
