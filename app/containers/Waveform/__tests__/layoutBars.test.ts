import { fitPeaks, layoutBars } from '../layoutBars';

describe('layoutBars', () => {
	it('fits every bar with a gap of at least one point', () => {
		expect(layoutBars(159, 40)).toEqual({ count: 40, gap: 1 });
	});

	it('spreads the bars when the track is wider than they need', () => {
		expect(layoutBars(300, 40)).toEqual({ count: 40, gap: 4 });
	});

	it('draws fewer bars on a narrow track', () => {
		expect(layoutBars(79, 40)).toEqual({ count: 20, gap: 1 });
	});

	it('always draws at least one bar', () => {
		expect(layoutBars(0, 40)).toEqual({ count: 1, gap: 1 });
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
