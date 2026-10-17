import { parseServerMessage } from '../parseServerMessage';

describe('parseServerMessage', () => {
	it('returns nothing for an empty body', () => {
		expect(parseServerMessage(undefined)).toBeUndefined();
		expect(parseServerMessage('')).toBeUndefined();
	});

	it('reads the error field', () => {
		expect(parseServerMessage('{"error":"File is too large"}')).toBe('File is too large');
	});

	it('falls back to the message field', () => {
		expect(parseServerMessage('{"message":"boom"}')).toBe('boom');
	});

	it('returns nothing for a non-JSON body', () => {
		expect(parseServerMessage('<html>413</html>')).toBeUndefined();
	});

	it('returns nothing for a JSON body with no usable message', () => {
		expect(parseServerMessage('{"success":false}')).toBeUndefined();
		expect(parseServerMessage('{"error":""}')).toBeUndefined();
	});
});
