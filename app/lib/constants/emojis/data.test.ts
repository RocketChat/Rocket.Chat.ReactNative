import { aliasesByEmojiName, emojisByCategory, shortnameToUnicodeMap } from './data';
import { emojis } from './emojis';
import { legacyShortnameToUnicodeMap } from './legacyShortnames';
import pinnedShortnames from '../../../../scripts/pinned-shortnames';

// The variation selector is presentational, so `⚠️` and `⚠` are the same emoji here.
const bare = (unicode: string) => unicode.replace(/\uFE0F/g, '');
const resolve = (name: string) => shortnameToUnicodeMap[`:${name}:`] ?? legacyShortnameToUnicodeMap[`:${name}:`];

// Every shortname whose glyph differs from the pre-emojibase map, spelled out so a regeneration
// cannot move one without failing here. The joiner (\u200D) and the variation selector (\uFE0F) are
// written as escapes: they are invisible in an editor, and they are the whole point of the second
// group.
const CHANGED_GLYPHS: [string, string][] = [
	// Held at what earlier releases resolved — see scripts/pinned-shortnames.js.
	[':beetle:', '🐞'],
	[':man_in_tuxedo:', '🤵'],
	[':man_in_tuxedo_tone1:', '🤵🏻'],
	[':man_in_tuxedo_tone2:', '🤵🏼'],
	[':man_in_tuxedo_tone3:', '🤵🏽'],
	[':man_in_tuxedo_tone4:', '🤵🏾'],
	[':man_in_tuxedo_tone5:', '🤵🏿'],
	// Repaired: the old map dropped the joiners, so these rendered as separate glyphs.
	[':kiss_mm:', '👨\u200D❤\uFE0F\u200D💋\u200D👨'],
	[':couplekiss_mm:', '👨\u200D❤\uFE0F\u200D💋\u200D👨'],
	[':kiss_ww:', '👩\u200D❤\uFE0F\u200D💋\u200D👩'],
	[':couplekiss_ww:', '👩\u200D❤\uFE0F\u200D💋\u200D👩'],
	[':kiss_woman_man:', '👩\u200D❤\uFE0F\u200D💋\u200D👨'],
	[':men_wrestling:', '🤼\u200D♂\uFE0F'],
	[':women_wrestling:', '🤼\u200D♀\uFE0F']
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
		const drifted = Object.keys(pinnedShortnames).filter(
			shortname => shortnameToUnicodeMap[shortname] !== pinnedShortnames[shortname as keyof typeof pinnedShortnames]
		);
		expect(drifted).toEqual([]);
	});

	it('holds every glyph that changed against the pre-emojibase map', () => {
		const drifted = CHANGED_GLYPHS.filter(([shortname, unicode]) => shortnameToUnicodeMap[shortname] !== unicode);
		expect(drifted).toEqual([]);
	});

	it('keeps legacy shortnames out of the current map', () => {
		expect(Object.keys(legacyShortnameToUnicodeMap).filter(key => key in shortnameToUnicodeMap)).toEqual([]);
	});
});
