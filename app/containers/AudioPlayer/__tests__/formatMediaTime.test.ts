import { formatMediaTime, formatProgressLabel } from '../formatMediaTime';

describe('formatMediaTime', () => {
	it('shows minutes and two-digit seconds', () => {
		expect(formatMediaTime(3.9)).toBe('0:03');
		expect(formatMediaTime(605)).toBe('10:05');
	});

	it('adds hours from one hour on', () => {
		expect(formatMediaTime(3725)).toBe('1:02:05');
	});

	it('shows an unknown time for invalid values', () => {
		expect(formatMediaTime(NaN)).toBe('-:--');
		expect(formatMediaTime(-1)).toBe('-:--');
	});
});

describe('formatProgressLabel', () => {
	it('shows the position over the duration', () => {
		expect(formatProgressLabel(3, 4)).toBe('0:03 / 0:04');
	});

	it('shows unknown times until the duration is known', () => {
		expect(formatProgressLabel(0, 0)).toBe('-:-- / -:--');
	});
});
