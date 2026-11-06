import { formatCallTimer } from '../formatCallTimer';

describe('formatCallTimer', () => {
	it('shows minutes and seconds, each with two digits, under an hour', () => {
		expect(formatCallTimer(0)).toBe('00:00');
		expect(formatCallTimer(5)).toBe('00:05');
		expect(formatCallTimer(517)).toBe('08:37');
		expect(formatCallTimer(300)).toBe('05:00');
		expect(formatCallTimer(3599)).toBe('59:59');
	});

	it('shows the hour, without padding it, once a call has been running that long', () => {
		expect(formatCallTimer(3600)).toBe('1:00:00');
		expect(formatCallTimer(7204)).toBe('2:00:04');
		expect(formatCallTimer(36000)).toBe('10:00:00');
	});

	it('does not count backwards for a negative elapsed time', () => {
		expect(formatCallTimer(-30)).toBe('00:00');
	});

	it('drops the fraction of a second', () => {
		expect(formatCallTimer(59.9)).toBe('00:59');
		expect(formatCallTimer(-0.5)).toBe('00:00');
	});
});
