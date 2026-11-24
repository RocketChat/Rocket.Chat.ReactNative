import { countBars, fitPeaks } from '../layoutBars';

describe('countBars', () => {
	it('fits every bar with a gap of at least one point', () => {
		expect(countBars(159, 40)).toBe(40);
	});

	it('draws fewer bars on a narrow track', () => {
		expect(countBars(79, 40)).toBe(20);
	});

	it('always draws at least one bar', () => {
		expect(countBars(0, 40)).toBe(1);
	});
});

describe('fitPeaks', () => {
	it('keeps the peaks when every bar fits', () => {
		expect(fitPeaks([0.1, 0.5, 1], 3)).toEqual([0.1, 0.5, 1]);
	});

	it('merges neighbouring peaks into the loudest of them', () => {
		expect(fitPeaks([0.1, 0.5, 1, 0.2], 2)).toEqual([0.5, 1]);
	});
});
