import ByteBuffer from 'bytebuffer';
import SimpleCrypto from 'react-native-simple-crypto';

import { random } from '../methods/helpers';
import { fromByteArray, toByteArray } from './helpers/base64-js';

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
export const randomPassword = (): string => `${random(3)}-${random(3)}-${random(3)}`.toLowerCase();
