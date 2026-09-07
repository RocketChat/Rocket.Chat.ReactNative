import { aliasesByEmojiName, emojisByCategory, shortnameToUnicodeMap } from './data';
import { emojis } from './emojis';
import { legacyShortnameToUnicodeMap } from './legacyShortnamesMap';
import pinnedShortnames from '../../../../scripts/pinned-shortnames';

const bare = (unicode: string) => unicode.replace(/\uFE0F/g, '');
const resolve = (name: string) => shortnameToUnicodeMap[`:${name}:`] ?? legacyShortnameToUnicodeMap[`:${name}:`];

// The only seven glyphs that changed against the pre-emojibase map, all repairs of a missing joiner.
const JOINER_REPAIRS: [string, string][] = [
	[':kiss_mm:', '👨\u200D❤\uFE0F\u200D💋\u200D👨'],
	[':couplekiss_mm:', '👨\u200D❤\uFE0F\u200D💋\u200D👨'],
	[':kiss_ww:', '👩\u200D❤\uFE0F\u200D💋\u200D👩'],
	[':couplekiss_ww:', '👩\u200D❤\uFE0F\u200D💋\u200D👩'],
	[':kiss_woman_man:', '👩\u200D❤\uFE0F\u200D💋\u200D👨'],
	[':men_wrestling:', '🤼\u200D♂\uFE0F'],
	[':women_wrestling:', '🤼\u200D♀\uFE0F']
];

// The pins, spelled out so editing scripts/pinned-shortnames.js fails here and not only in the picker.
const PINNED_GLYPHS: [string, string][] = [
	[':beetle:', '🐞'],
	[':man_in_tuxedo:', '🤵'],
	[':man_in_tuxedo_tone1:', '🤵🏻'],
	[':man_in_tuxedo_tone2:', '🤵🏼'],
	[':man_in_tuxedo_tone3:', '🤵🏽'],
	[':man_in_tuxedo_tone4:', '🤵🏾'],
	[':man_in_tuxedo_tone5:', '🤵🏿']
];

const UNLISTED_COMPONENTS = [
	...Array.from({ length: 26 }, (_, i) => `regional_indicator_${String.fromCharCode(97 + i)}`),
	'digit_zero',
	'digit_one',
	'digit_two',
	'digit_three',
	'digit_four',
	'digit_five',
	'digit_six',
	'digit_seven',
	'digit_eight',
	'digit_nine',
	'asterisk_symbol',
	'pound_symbol'
];

describe('emoji data', () => {
	it('resolves every listed emoji to a unicode character', () => {
		const unresolved = emojis.filter(name => !shortnameToUnicodeMap[`:${name}:`]);
		expect(unresolved).toEqual([]);
	});

	it('lists every emoji exactly once', () => {
		expect(emojis.length).toBe(new Set(emojis).size);
	});

	it('keys aliases by a listed emoji name', () => {
		const listed = new Set(emojis);
		expect(Object.keys(aliasesByEmojiName).filter(name => !listed.has(name))).toEqual([]);
	});

	it('resolves every alias to the same emoji as the name it belongs to', () => {
		const mismatched = Object.keys(aliasesByEmojiName).filter(name => {
			const expected = bare(shortnameToUnicodeMap[`:${name}:`]);
			return aliasesByEmojiName[name].some(alias => bare(resolve(alias) ?? '') !== expected);
		});
		expect(mismatched).toEqual([]);
	});

	it('has no category with an empty emoji list', () => {
		expect(
			Object.keys(emojisByCategory).filter(key => emojisByCategory[key as keyof typeof emojisByCategory].length === 0)
		).toEqual([]);
	});

	it('holds every pinned shortname at its pinned glyph', () => {
		expect(Object.entries(pinnedShortnames)).toEqual(PINNED_GLYPHS);
		const drifted = Object.keys(pinnedShortnames).filter(
			shortname => shortnameToUnicodeMap[shortname] !== pinnedShortnames[shortname as keyof typeof pinnedShortnames]
		);
		expect(drifted).toEqual([]);
	});

	it('holds every repaired joiner glyph at the value this branch decided on', () => {
		const drifted = JOINER_REPAIRS.filter(([shortname, unicode]) => shortnameToUnicodeMap[shortname] !== unicode);
		expect(drifted).toEqual([]);
	});

	it('never puts a variation selector before a skin tone modifier', () => {
		const illFormed = [shortnameToUnicodeMap, legacyShortnameToUnicodeMap].flatMap(map =>
			Object.keys(map).filter(key => /\uFE0F[\u{1F3FB}-\u{1F3FF}]/u.test(map[key]))
		);
		expect(illFormed).toEqual([]);
	});

	it('resolves every unlisted component without listing it', () => {
		expect(UNLISTED_COMPONENTS.filter(name => !resolve(name))).toEqual([]);
		const listed = new Set(emojis);
		expect(UNLISTED_COMPONENTS.filter(name => listed.has(name))).toEqual([]);
	});

	it('keeps legacy shortnames out of the current map', () => {
		expect(Object.keys(legacyShortnameToUnicodeMap).filter(key => key in shortnameToUnicodeMap)).toEqual([]);
	});
});
