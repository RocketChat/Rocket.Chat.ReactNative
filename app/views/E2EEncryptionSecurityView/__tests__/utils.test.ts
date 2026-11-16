import { validateE2EPassword } from '../utils';

const STRONG_PASSWORD = 'Correct horse battery stapl 4!';

describe('validateE2EPassword', () => {
	it('accepts a password that meets every policy', () => {
		expect(validateE2EPassword(STRONG_PASSWORD)).toBe(true);
	});

	it.each([
		['shorter than 30 characters', 'Correct horse battery stap 4!'],
		['without a lowercase letter', STRONG_PASSWORD.toUpperCase()],
		['without an uppercase letter', STRONG_PASSWORD.toLowerCase()],
		['without a number', 'Correct horse battery staple XY!'],
		['without a symbol', 'Correcthorsebatterystaple42XYZW']
	])('rejects a password %s', (_rule, password) => {
		expect(validateE2EPassword(password)).toBe(false);
	});
});
