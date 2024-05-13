import ByteBuffer from 'bytebuffer';
import SimpleCrypto from 'react-native-simple-crypto';
import EJSON from 'ejson';
import { atob } from 'js-base64';

import { random } from '../methods/helpers';
import { fromByteArray, toByteArray } from './helpers/base64-js';

const BASE64URI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < BASE64URI.length; i++) {
	lookup[BASE64URI.charCodeAt(i)] = i;
}

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
export const b64URIToBuffer = (base64: string): ArrayBuffer => {
	console.log('🚀 ~ b64URIToBuffer ~ base64:', base64);
	const bufferLength = base64.length * 0.75;
	const len = base64.length;
	let i;
	let p = 0;
	let encoded1;
	let encoded2;
	let encoded3;
	let encoded4;

	const arraybuffer = new ArrayBuffer(bufferLength);
	const bytes = new Uint8Array(arraybuffer);

	for (i = 0; i < len; i += 4) {
		encoded1 = lookup[base64.charCodeAt(i)];
		encoded2 = lookup[base64.charCodeAt(i + 1)];
		encoded3 = lookup[base64.charCodeAt(i + 2)];
		encoded4 = lookup[base64.charCodeAt(i + 3)];

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
		bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
		bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	}

	return arraybuffer;
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

export const generateAESCTRKey = () => SimpleCrypto.utils.randomBytes(16);

export const exportAESCTR = key => {
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
	// return EJSON.stringify(exportedKey);
};

export const encryptAESCTR = (path: string, key: ArrayBuffer, vector: ArrayBuffer) =>
	SimpleCrypto.AES.encryptFile(path, key, vector);

export const decryptAESCTR = (path: string, key: ArrayBuffer, vector: ArrayBuffer) =>
	SimpleCrypto.AES.decryptFile(path, key, vector);

// Base 64 encoding

const BASE_64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE_64_VALS = Object.create(null);

const getChar = (val: number) => BASE_64_CHARS.charAt(val);
const getVal = (ch: string) => (ch === '=' ? -1 : BASE_64_VALS[ch]);

for (let i = 0; i < BASE_64_CHARS.length; i++) {
	BASE_64_VALS[getChar(i)] = i;
}

// XXX This is a weird place for this to live, but it's used both by
// this package and 'ejson', and we can't put it in 'ejson' without
// introducing a circular dependency. It should probably be in its own
// package or as a helper in a package that both 'base64' and 'ejson'
// use.
const newBinary = (len: number) => {
	if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
		const ret = Object.assign(
			Array.from({ length: len }, () => 0),
			{
				$Uint8ArrayPolyfill: true
			}
		);
		return ret;
	}
	return new Uint8Array(new ArrayBuffer(len));
};

const encode = (array: ArrayLike<number> | string) => {
	if (typeof array === 'string') {
		const str = array;
		const binary = newBinary(str.length);
		for (let i = 0; i < str.length; i++) {
			const ch = str.charCodeAt(i);
			if (ch > 0xff) {
				throw new Error('Not ascii. Base64.encode can only take ascii strings.');
			}

			binary[i] = ch;
		}
		array = binary;
	}

	const answer: string[] = [];
	let a: number | null = null;
	let b: number | null = null;
	let c: number | null = null;
	let d: number | null = null;

	for (let i = 0; i < array.length; i++) {
		switch (i % 3) {
			case 0:
				a = (array[i] >> 2) & 0x3f;
				b = (array[i] & 0x03) << 4;
				break;
			case 1:
				b = (b ?? 0) | ((array[i] >> 4) & 0xf);
				c = (array[i] & 0xf) << 2;
				break;
			case 2:
				c = (c ?? 0) | ((array[i] >> 6) & 0x03);
				d = array[i] & 0x3f;
				answer.push(getChar(a ?? 0));
				answer.push(getChar(b ?? 0));
				answer.push(getChar(c));
				answer.push(getChar(d));
				a = null;
				b = null;
				c = null;
				d = null;
				break;
		}
	}

	if (a !== null) {
		answer.push(getChar(a));
		answer.push(getChar(b ?? 0));
		if (c === null) {
			answer.push('=');
		} else {
			answer.push(getChar(c));
		}

		if (d === null) {
			answer.push('=');
		}
	}

	return answer.join('');
};

const decode = (str: string) => {
	let len = Math.floor((str.length * 3) / 4);
	if (str.charAt(str.length - 1) === '=') {
		len--;
		if (str.charAt(str.length - 2) === '=') {
			len--;
		}
	}

	const arr = newBinary(len);

	let one: number | null = null;
	let two: number | null = null;
	let three: number | null = null;

	let j = 0;

	for (let i = 0; i < str.length; i++) {
		const c = str.charAt(i);
		const v = getVal(c);
		switch (i % 4) {
			case 0:
				if (v < 0) {
					throw new Error('invalid base64 string');
				}

				one = v << 2;
				break;
			case 1:
				if (v < 0) {
					throw new Error('invalid base64 string');
				}

				one = (one ?? 0) | (v >> 4);
				arr[j++] = one;
				two = (v & 0x0f) << 4;
				break;
			case 2:
				if (v >= 0) {
					two = (two ?? 0) | (v >> 2);
					arr[j++] = two;
					three = (v & 0x03) << 6;
				}

				break;
			case 3:
				if (v >= 0) {
					arr[j++] = (three ?? 0) | v;
				}

				break;
		}
	}

	return arr;
};

export function base64Decode(string) {
	string = atob(string);
	const { length } = string;
	const buf = new ArrayBuffer(length);
	const bufView = new Uint8Array(buf);
	for (let i = 0; i < string.length; i++) {
		bufView[i] = string.charCodeAt(i);
	}
	return buf;
}

// console.log(
// 	atob(
// 		'eyJrZXkiOnsiYWxnIjoiQTI1NkNUUiIsImV4dCI6dHJ1ZSwiayI6Ink1MDhHNTNTZHpvVnVibVM1Z01leHpmLXBkeDVDd3hZZFQwNVNBcVdURU0iLCJrZXlfb3BzIjpbImVuY3J5cHQiLCJkZWNyeXB0Il0sImt0eSI6Im9jdCJ9LCJpdiI6IkRBQnY2YnRhRTg1ZEVyTTJMdGJXakE9PSJ9'
// 	)
// );

export const Base64 = { encode, decode, newBinary };
