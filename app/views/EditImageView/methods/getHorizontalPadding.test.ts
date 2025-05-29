import getHorizontalPadding from './getHorizontalPadding';

describe('getHorizontalPadding', () => {
	it('returns 0 when width equals resizedWidth', () => {
		expect(getHorizontalPadding(100, 100)).toBe(0);
	});

	it('returns correct padding when width is greater than resizedWidth', () => {
		expect(getHorizontalPadding(120, 100)).toBe(10);
		expect(getHorizontalPadding(200, 150)).toBe(25);
	});

	it('returns negative padding when resizedWidth is greater than width', () => {
		expect(getHorizontalPadding(100, 120)).toBe(-10);
	});

	it('returns fractional padding when the result is a float', () => {
		expect(getHorizontalPadding(101, 100)).toBe(0.5);
	});

	it('handles zero values correctly', () => {
		expect(getHorizontalPadding(0, 0)).toBe(0);
		expect(getHorizontalPadding(100, 0)).toBe(50);
	});
});
