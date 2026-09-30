import { formatTime } from './utils';

describe('formatTime', () => {
	it('formats sub-minute duration as mm:ss with both parts zero-padded', () => {
		expect(formatTime(5)).toBe('00:05');
	});

	it('formats multi-minute duration with seconds zero-padded', () => {
		expect(formatTime(12 * 60 + 3)).toBe('12:03');
	});

	it('formats 0 as 00:00', () => {
		expect(formatTime(0)).toBe('00:00');
	});

	it('pads minutes only below 10', () => {
		expect(formatTime(9 * 60 + 59)).toBe('09:59');
		expect(formatTime(10 * 60)).toBe('10:00');
	});

	it('does not roll minutes over at 60', () => {
		expect(formatTime(60 * 60)).toBe('60:00');
	});
});
