import { parseRetryAfter } from '../parseRetryAfter';

describe('parseRetryAfter', () => {
	it.each([
		[undefined, undefined],
		[null, undefined],
		['', undefined],
		['0', undefined],
		['-5', undefined],
		['37', 37],
		['nonsense', undefined]
	])('parses %p as %p', (value, expected) => {
		expect(parseRetryAfter(value)).toBe(expected);
	});

	it('parses an HTTP date into the seconds remaining', () => {
		jest.spyOn(Date, 'now').mockReturnValue(Date.parse('Wed, 21 Oct 2015 07:28:00 GMT'));

		expect(parseRetryAfter('Wed, 21 Oct 2015 07:28:30 GMT')).toBe(30);

		(Date.now as jest.Mock).mockRestore();
	});

	it('ignores an HTTP date already in the past', () => {
		jest.spyOn(Date, 'now').mockReturnValue(Date.parse('Wed, 21 Oct 2015 07:29:00 GMT'));

		expect(parseRetryAfter('Wed, 21 Oct 2015 07:28:00 GMT')).toBeUndefined();

		(Date.now as jest.Mock).mockRestore();
	});
});
