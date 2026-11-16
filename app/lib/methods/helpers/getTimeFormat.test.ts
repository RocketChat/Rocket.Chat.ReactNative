import { getTimeFormat } from './getTimeFormat';

describe('getTimeFormat', () => {
	const SERVER_FORMAT = 'LT';

	it('returns 12-hour format when clockMode is 1', () => {
		expect(getTimeFormat(1, SERVER_FORMAT)).toBe('h:mm A');
	});

	it('returns 24-hour format when clockMode is 2', () => {
		expect(getTimeFormat(2, SERVER_FORMAT)).toBe('H:mm');
	});

	it('returns server format when clockMode is 0 (Default)', () => {
		expect(getTimeFormat(0, SERVER_FORMAT)).toBe(SERVER_FORMAT);
	});

	it('returns server format when clockMode is not set', () => {
		expect(getTimeFormat(undefined, SERVER_FORMAT)).toBe(SERVER_FORMAT);
	});
});
