import { formatStatusExpiry } from './formatStatusExpiry';

jest.mock('../../../i18n', () => ({
	t: (key: string) => key
}));

describe('formatStatusExpiry', () => {
	it('returns undefined for an already-expired timestamp', () => {
		const past = new Date(Date.now() - 60_000).toISOString();
		expect(formatStatusExpiry(past)).toBeUndefined();
	});

	it('returns undefined for an invalid date string', () => {
		expect(formatStatusExpiry('not-a-date')).toBeUndefined();
	});

	it('returns "Until HH:mm A" for a same-day future timestamp', () => {
		// Pin a specific UTC date: 2026-06-09T08:00:00Z, expires at 10:00Z same day
		const expiresAt = new Date('2026-06-09T10:00:00.000Z');
		jest.useFakeTimers({ now: new Date('2026-06-09T08:00:00.000Z').getTime() });
		const result = formatStatusExpiry(expiresAt.toISOString());
		jest.useRealTimers();
		expect(result).toBe('Until 10:00 AM');
	});

	it('returns "Until MMM D, HH:mm A" for a different-day future timestamp', () => {
		const expiresAt = new Date('2026-06-15T09:30:00.000Z');
		jest.useFakeTimers({ now: new Date('2026-06-09T08:00:00.000Z').getTime() });
		const result = formatStatusExpiry(expiresAt.toISOString());
		jest.useRealTimers();
		expect(result).toBe('Until Jun 15, 9:30 AM');
	});

	it('returns undefined when timestamp equals now exactly', () => {
		const now = new Date('2026-06-09T08:00:00.000Z');
		jest.useFakeTimers({ now: now.getTime() });
		const result = formatStatusExpiry(now.toISOString());
		jest.useRealTimers();
		expect(result).toBeUndefined();
	});
});
