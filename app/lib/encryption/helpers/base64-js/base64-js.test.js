/* eslint-disable no-undef */
/* eslint-disable no-bitwise */
// https://github.com/beatgammit/base64-js/tree/master/test

import { byteLength, fromByteArray, toByteArray } from './index';

const map = (arr, callback) => {
	const res = [];
	let kValue;
	let mappedValue;

	for (let k = 0, len = arr.length; k < len; k += 1) {
		if (typeof arr === 'string' && !!arr.charAt(k)) {
			kValue = arr.charAt(k);
			mappedValue = callback(kValue, k, arr);
			res[k] = mappedValue;
		} else if (typeof arr !== 'string' && k in arr) {
			kValue = arr[k];
			mappedValue = callback(kValue, k, arr);
			res[k] = mappedValue;
		}
	}
	return res;
};

expect.extend({
	toBeEqual(a, b) {
		let i;
		const { length } = a;
		if (length !== b.length) {
			return {
				pass: false
			};
		}
		for (i = 0; i < length; i += 1) {
			if ((a[i] & 0xff) !== (b[i] & 0xff)) {
				return {
					pass: false
				};
			}
		}
		return {
			pass: true
		};
	}
});

test('decode url-safe style base64 strings', () => {
	const expected = [0xff, 0xff, 0xbe, 0xff, 0xef, 0xbf, 0xfb, 0xef, 0xff];

	let str = '//++/++/++//';
	let actual = toByteArray(str);
	for (let i = 0; i < actual.length; i += 1) {
		expect(actual[i]).toBe(expected[i]);
	}

	expect(byteLength(str)).toBe(actual.length);

	str = '__--_--_--__';
	actual = toByteArray(str);
	for (let i = 0; i < actual.length; i += 1) {
		expect(actual[i]).toBe(expected[i]);
	}

	expect(byteLength(str)).toBe(actual.length);
});

test('padding bytes found inside base64 string', () => {
	// See https://github.com/beatgammit/base64-js/issues/42
	const str = 'SQ==QU0=';
	expect(toByteArray(str)).toEqual(new Uint8Array([73]));
	expect(byteLength(str)).toBe(1);
});

const checks = ['a', 'aa', 'aaa', 'hi', 'hi!', 'hi!!', 'sup', 'sup?', 'sup?!'];

test('convert to base64 and back', () => {
	for (let i = 0; i < checks.length; i += 1) {
		const check = checks[i];

		const b64Str = fromByteArray(map(check, char => char.charCodeAt(0)));

		const arr = toByteArray(b64Str);
		const str = map(arr, byte => String.fromCharCode(byte)).join('');

		expect(check).toBe(str);
		expect(byteLength(b64Str)).toBe(arr.length);
	}
});

const data = [
	[[0, 0, 0], 'AAAA'],
	[[0, 0, 1], 'AAAB'],
	[[0, 1, -1], 'AAH/'],
	[[1, 1, 1], 'AQEB'],
	[[0, -73, 23], 'ALcX']
];

test('convert known data to string', () => {
	for (let i = 0; i < data.length; i += 1) {
		const bytes = data[i][0];
		const expected = data[i][1];
		const actual = fromByteArray(bytes);
		expect(actual).toBe(expected);
	}
});

test('convert known data from string', () => {
	for (let i = 0; i < data.length; i += 1) {
		const expected = data[i][0];
		const string = data[i][1];
		const actual = toByteArray(string);
		expect(actual).toBeEqual(expected);
		const length = byteLength(string);
		expect(length).toBe(expected.length);
	}
});

test('convert big data to base64', () => {
	let i;
	let length;
	const big = new Uint8Array(64 * 1024 * 1024);
	for (i = 0, length = big.length; i < length; i += 1) {
		big[i] = i % 256;
	}
	const b64str = fromByteArray(big);
	const arr = toByteArray(b64str);
	expect(arr).toBeEqual(big);
	expect(byteLength(b64str)).toBe(arr.length);
});
