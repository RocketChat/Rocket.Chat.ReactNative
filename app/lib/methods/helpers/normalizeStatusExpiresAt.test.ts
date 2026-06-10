import dayjs from '../../dayjs';
import { normalizeStatusExpiresAt } from './normalizeStatusExpiresAt';

describe('normalizeStatusExpiresAt', () => {
	const isoString = '2026-06-11T10:00:00.000Z';
	const timestampMs = 1752300000000;
	const timestampSec = 1752300000;

	it('returns undefined for null', () => {
		expect(normalizeStatusExpiresAt(null)).toBeUndefined();
	});

	it('returns undefined for undefined', () => {
		expect(normalizeStatusExpiresAt(undefined)).toBeUndefined();
	});

	it('returns undefined for empty string', () => {
		expect(normalizeStatusExpiresAt('')).toBeUndefined();
	});

	it('returns undefined for invalid string', () => {
		expect(normalizeStatusExpiresAt('not-a-date')).toBeUndefined();
	});

	it('returns the same ISO string for a valid ISO string', () => {
		expect(normalizeStatusExpiresAt(isoString)).toBe(isoString);
	});

	it('converts a Date object to ISO string', () => {
		const date = new Date(isoString);
		expect(normalizeStatusExpiresAt(date)).toBe(isoString);
	});

	it('converts a number (ms timestamp) to ISO string', () => {
		expect(normalizeStatusExpiresAt(timestampMs)).toBe(dayjs(timestampMs).toISOString());
	});

	it('converts a number (seconds timestamp) to ISO string', () => {
		expect(normalizeStatusExpiresAt(timestampSec)).toBe(dayjs(timestampSec).toISOString());
	});

	it('converts EJSON date format {$date: ms} to ISO string', () => {
		expect(normalizeStatusExpiresAt({ $date: timestampMs })).toBe(dayjs(timestampMs).toISOString());
	});

	it('returns undefined for an invalid EJSON date', () => {
		expect(normalizeStatusExpiresAt({ $date: 'invalid' })).toBeUndefined();
	});

	it('returns undefined for a plain object without $date', () => {
		expect(normalizeStatusExpiresAt({ foo: 'bar' })).toBeUndefined();
	});
});
