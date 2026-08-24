import { aliasesByEmojiName, emojisByCategory, shortnameToUnicodeMap } from './data';
import { emojis } from './emojis';
import { legacyShortnameToUnicodeMap } from './legacyShortnames';

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
		const mismatched = Object.keys(aliasesByEmojiName).filter(name =>
			aliasesByEmojiName[name].some(alias => {
				const unicode = shortnameToUnicodeMap[`:${alias}:`] ?? legacyShortnameToUnicodeMap[`:${alias}:`];
				return !unicode;
			})
		);
		expect(mismatched).toEqual([]);
	});

	it('has no category with an empty emoji list', () => {
		expect(
			Object.keys(emojisByCategory).filter(key => emojisByCategory[key as keyof typeof emojisByCategory].length === 0)
		).toEqual([]);
	});

	it('keeps legacy shortnames out of the current map', () => {
		expect(Object.keys(legacyShortnameToUnicodeMap).filter(key => key in shortnameToUnicodeMap)).toEqual([]);
	});
});
