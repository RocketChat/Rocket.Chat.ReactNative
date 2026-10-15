import { backdropTint } from '../backdropTint';

describe('backdropTint', () => {
	it('gives the same name the same tint every time', () => {
		expect(backdropTint('Ada Lovelace')).toBe(backdropTint('Ada Lovelace'));
	});

	it('maps names onto each of the five tints', () => {
		expect(backdropTint('')).toBe('#5f141480');
		expect(backdropTint('e')).toBe('#1a3a5f80');
		expect(backdropTint('a')).toBe('#145f2a80');
		expect(backdropTint('b')).toBe('#5f4a1480');
		expect(backdropTint('c')).toBe('#3a145f80');
	});

	it('picks the tints the web client picks for the same names', () => {
		expect(backdropTint('Ada Lovelace')).toBe('#5f4a1480');
		expect(backdropTint('rohit.bansal')).toBe('#5f4a1480');
		expect(backdropTint('bob')).toBe('#145f2a80');
		expect(backdropTint('user-2')).toBe('#3a145f80');
		expect(backdropTint('Zoë')).toBe('#1a3a5f80');
	});
});
