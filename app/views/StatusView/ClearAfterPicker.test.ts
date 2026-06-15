import dayjs from '../../lib/dayjs';
import { computeExpiresAt } from './ClearAfterPicker';

describe('computeExpiresAt', () => {
	beforeEach(() => {
		jest.useFakeTimers({ now: new Date('2026-06-15T08:00:00.000Z').getTime() });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('returns null for empty value', () => {
		expect(computeExpiresAt('', null)).toBeNull();
	});

	it('returns ISO string 30 minutes from now for "30"', () => {
		const result = computeExpiresAt('30', null);
		const expected = dayjs('2026-06-15T08:00:00.000Z').add(30, 'minute').toISOString();
		expect(result).toBe(expected);
	});

	it('returns ISO string 1 hour from now for "60"', () => {
		const result = computeExpiresAt('60', null);
		const expected = dayjs('2026-06-15T08:00:00.000Z').add(1, 'hour').toISOString();
		expect(result).toBe(expected);
	});

	it('returns ISO string for custom value with a valid date', () => {
		const date = new Date('2026-06-15T10:00:00.000Z');
		const result = computeExpiresAt('custom', date);
		expect(result).toBe(date.toISOString());
	});

	it('returns null for custom value with null date', () => {
		const result = computeExpiresAt('custom', null);
		expect(result).toBeNull();
	});

	it('returns null for unknown value', () => {
		// @ts-ignore - testing unexpected value
		const result = computeExpiresAt('unknown', null);
		expect(result).toBeNull();
	});
});
