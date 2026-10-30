import { decodePrefixedBase64, encodePrefixedBase64, generatePassphrase, parsePrivateKey } from '../utils';
import { wordlist } from '../wordList';

const KEY_ID = 'key-id';
const USER_ID = 'user-id';

describe('prefixed base64', () => {
	it('rejects a base64 tail that does not decode to 256 bytes', () => {
		expect(() => decodePrefixedBase64(`${KEY_ID}${'A'.repeat(344)}`)).toThrow(RangeError);
	});

	it('rejects data that is not 256 bytes long', () => {
		expect(() => encodePrefixedBase64(KEY_ID, new ArrayBuffer(257))).toThrow(RangeError);
	});
});

describe('parsePrivateKey', () => {
	it.each(['"a string"', 'null', '{"$binary":1}', '{"iv":"AAAA","ciphertext":"AAAA"}'])('rejects %s', privateKey => {
		expect(() => parsePrivateKey(privateKey, USER_ID)).toThrow(new TypeError('Invalid private key format'));
	});

	it('salts a v2 key without a stored salt with the user id', () => {
		const { salt, version } = parsePrivateKey('{"iv":"AAAA","ciphertext":"AAAA","iterations":100000}', USER_ID);

		expect({ salt, version }).toEqual({ salt: USER_ID, version: 'v2' });
	});
});

describe('generatePassphrase', () => {
	it('picks 12 words from the word list', async () => {
		const words = (await generatePassphrase()).split(' ');

		expect(words).toHaveLength(12);
		words.forEach(word => expect(wordlist).toContain(word));
	});
});
