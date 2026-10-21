import { sidebarCapacity, spotlightOrientation } from '../spotlightOrientation';

describe('spotlightOrientation', () => {
	it('puts the thumbs beside a wide stage and under a narrow one', () => {
		expect(spotlightOrientation({ width: 1500, height: 1000 })).toBe('side-by-side');
		expect(spotlightOrientation({ width: 1400, height: 1000 })).toBe('stacked');
		expect(spotlightOrientation({ width: 0, height: 0 })).toBe('stacked');
	});
});

describe('sidebarCapacity', () => {
	it('is unbounded until the stage is measured', () => {
		expect(sidebarCapacity({ width: 0, height: 500 }, 'stacked')).toBe(Infinity);
		expect(sidebarCapacity({ width: 500, height: 0 }, 'side-by-side')).toBe(Infinity);
	});

	it('counts the thumbs that fit along the column or the strip, never fewer than one', () => {
		expect(sidebarCapacity({ width: 1600, height: 600 }, 'side-by-side')).toBe(5);
		expect(sidebarCapacity({ width: 600, height: 800 }, 'stacked')).toBe(4);
		expect(sidebarCapacity({ width: 50, height: 800 }, 'stacked')).toBe(1);
	});
});
