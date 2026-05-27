import { decodeRoleIdFromStorage, encodeRoleIdForStorage } from './handleRoleId';

describe('UTF-8 Encoding/Decoding Functions', () => {
	describe('encodeRoleIdForStorage', () => {
		it('should return the original ID if it is already UTF-8 encoded', () => {
			const utf8String = 'Hello World';
			expect(encodeRoleIdForStorage(utf8String)).toBe(utf8String);
		});

		it('should encode non-UTF-8 strings', () => {
			const nonUtf8String = 'Hello%テストDb壊れた';
			expect(encodeRoleIdForStorage(nonUtf8String)).toBe(encodeURIComponent(nonUtf8String));
		});

		it('should return undefined if no ID is provided', () => {
			expect(encodeRoleIdForStorage()).toBeUndefined();
		});
	});

	describe('decodeRoleIdFromStorage', () => {
		it('should decode a UTF-8 encoded string', () => {
			const encodedString = 'テストDb壊れた';
			expect(decodeRoleIdFromStorage(encodedString)).toBe(decodeURIComponent(encodedString));
		});

		it('should return the original string if no encoding is present', () => {
			const utf8String = 'Hello World';
			expect(decodeRoleIdFromStorage(utf8String)).toBe(utf8String);
		});
	});
});
