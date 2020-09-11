/* eslint-disable no-bitwise */
import ByteBuffer from 'bytebuffer';
import SimpleCrypto from 'react-native-simple-crypto';

import random from '../../utils/random';
import { fromByteArray, toByteArray } from '../../utils/base64-js';

const BASE64URI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export const b64ToBuffer = base64 => toByteArray(base64).buffer;
export const utf8ToBuffer = SimpleCrypto.utils.convertUtf8ToArrayBuffer;
export const bufferToB64 = arrayBuffer => fromByteArray(new Uint8Array(arrayBuffer));
// ArrayBuffer -> Base64 URI Safe
// https://github.com/herrjemand/Base64URL-ArrayBuffer/blob/master/lib/base64url-arraybuffer.js
export const bufferToB64URI = (buffer) => {
	const uintArray = new Uint8Array(buffer);
	const len = uintArray.length;
	let base64 = '';

	for (let i = 0; i < len; i += 3) {
		base64 += BASE64URI[uintArray[i] >> 2];
		base64 += BASE64URI[((uintArray[i] & 3) << 4) | (uintArray[i + 1] >> 4)];
		base64 += BASE64URI[((uintArray[i + 1] & 15) << 2) | (uintArray[i + 2] >> 6)];
		base64 += BASE64URI[uintArray[i + 2] & 63];
	}

	if ((len % 3) === 2) {
		base64 = base64.substring(0, base64.length - 1);
	} else if (len % 3 === 1) {
		base64 = base64.substring(0, base64.length - 2);
	}

	return base64;
};
// SimpleCrypto.utils.convertArrayBufferToUtf8 is not working with unicode emoji
export const bufferToUtf8 = (buffer) => {
	const uintArray = new Uint8Array(buffer);
	const encodedString = String.fromCharCode.apply(null, uintArray);
	const decodedString = decodeURIComponent(escape(encodedString));
	return decodedString;
};
export const splitVectorData = (text) => {
	const vector = text.slice(0, 16);
	const data = text.slice(16);
	return [vector, data];
};
export const joinVectorData = (vector, data) => {
	const output = new Uint8Array(vector.byteLength + data.byteLength);
	output.set(new Uint8Array(vector), 0);
	output.set(new Uint8Array(data), vector.byteLength);
	return output.buffer;
};
export const toString = (thing) => {
	if (typeof thing === 'string') {
		return thing;
	}
	// eslint-disable-next-line new-cap
	return new ByteBuffer.wrap(thing).toString('binary');
};
export const randomPassword = () => `${ random(3) }-${ random(3) }-${ random(3) }`.toLowerCase();
