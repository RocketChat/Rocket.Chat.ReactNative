const ZWJ = 0x200d;
const VARIATION_SELECTOR_16 = 0xfe0f;
const VARIATION_SELECTOR_15 = 0xfe0e;
const COMBINING_ENCLOSING_KEYCAP = 0x20e3;

const isSkinTone = (codePoint: number) => codePoint >= 0x1f3fb && codePoint <= 0x1f3ff;
const isRegionalIndicator = (codePoint: number) => codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
const isAttachedToWhatPrecedesIt = (codePoint: number) =>
	codePoint === VARIATION_SELECTOR_16 ||
	codePoint === VARIATION_SELECTOR_15 ||
	codePoint === COMBINING_ENCLOSING_KEYCAP ||
	isSkinTone(codePoint);

const codePointBefore = (text: string, index: number) => {
	const low = text.charCodeAt(index - 1);
	if (low >= 0xdc00 && low <= 0xdfff && index >= 2) {
		const high = text.charCodeAt(index - 2);
		if (high >= 0xd800 && high <= 0xdbff) {
			return { codePoint: text.codePointAt(index - 2) as number, size: 2 };
		}
	}
	return { codePoint: low, size: 1 };
};

// How many UTF-16 code units the character ending at `end` occupies, counting a whole emoji
// sequence as one. Backspace deletes that many, so a tap removes the glyph rather than an
// invisible modifier — emojibase emits fully-qualified sequences, so most emoji end in U+FE0F.
export const lastGlyphLength = (text: string, end: number): number => {
	if (end <= 0) {
		return 0;
	}
	let index = end;
	let length = 0;
	while (index > 0) {
		const { codePoint, size } = codePointBefore(text, index);
		index -= size;
		length += size;

		if (isAttachedToWhatPrecedesIt(codePoint)) {
			continue;
		}
		if (index >= 1 && text.charCodeAt(index - 1) === ZWJ) {
			index -= 1;
			length += 1;
			continue;
		}
		// Flags are a pair of regional indicators with nothing joining them.
		if (isRegionalIndicator(codePoint) && index >= 2) {
			const previous = codePointBefore(text, index);
			if (isRegionalIndicator(previous.codePoint)) {
				length += previous.size;
			}
		}
		break;
	}
	return length;
};
