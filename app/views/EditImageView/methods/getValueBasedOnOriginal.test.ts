import getValueBasedOnOriginal from './getValueBasedOnOriginal';

describe('getValueBasedOnOriginal', () => {
	it('returns the same value when originalSize equals screenScale', () => {
		expect(getValueBasedOnOriginal(50, 100, 100)).toBe(50);
	});

	it('scales up correctly when originalSize > screenScale', () => {
		expect(getValueBasedOnOriginal(50, 200, 100)).toBe(100);
	});

	it('scales down correctly when originalSize < screenScale', () => {
		expect(getValueBasedOnOriginal(100, 100, 200)).toBe(50);
	});

	it('returns 0 when cuttedValue is 0', () => {
		expect(getValueBasedOnOriginal(0, 100, 100)).toBe(0);
	});

	it('handles decimal scaling correctly', () => {
		expect(getValueBasedOnOriginal(25, 150, 100)).toBe(37.5);
	});

	it('handles division by zero safely (screenScale = 0)', () => {
		expect(() => getValueBasedOnOriginal(50, 100, 0)).toThrow();
	});
});
