import { lastGlyphLength } from './lastGlyphLength';

const at = (text: string) => lastGlyphLength(text, text.length);

describe('lastGlyphLength', () => {
	it('counts a plain character as one code unit', () => {
		expect(at('ab')).toBe(1);
	});

	it('counts a surrogate pair as one glyph', () => {
		expect(at('\u{1F6B2}')).toBe(2);
	});

	it('counts a surrogate pair followed by a variation selector as one glyph', () => {
		// What emojibase emits for :bike:, and what the old two-code-unit window missed.
		expect(at('\u{1F6B2}️')).toBe(3);
	});

	it('counts a variation selector on a BMP base as one glyph', () => {
		expect(at('❤️')).toBe(2);
	});

	it('counts a skin tone modifier as part of the glyph', () => {
		expect(at('\u{1F44D}\u{1F3FD}')).toBe(4);
	});

	it('counts a ZWJ sequence as one glyph', () => {
		expect(at('\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}')).toBe(11);
	});

	it('counts a ZWJ sequence ending in a variation selector as one glyph', () => {
		expect(at('\u{1F93C}‍♂️')).toBe(5);
	});

	it('counts a keycap as one glyph', () => {
		expect(at('1️⃣')).toBe(3);
	});

	it('counts a flag as one glyph', () => {
		expect(at('\u{1F1E7}\u{1F1F7}')).toBe(4);
	});

	it('leaves text before the glyph alone', () => {
		expect(lastGlyphLength('hi \u{1F6B2}️ there', 6)).toBe(3);
	});

	it('returns zero at the start of the text', () => {
		expect(lastGlyphLength('abc', 0)).toBe(0);
	});
});
