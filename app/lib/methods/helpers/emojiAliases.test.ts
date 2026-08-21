import { getEmojiAliases, searchEmojiNames } from './emojiAliases';

describe('searchEmojiNames', () => {
	it('matches the picker shortname', () => {
		expect(searchEmojiNames('ocean')).toContain('ocean');
	});

	it('matches a cldr alias used by the web client and returns the picker shortname', () => {
		const result = searchEmojiNames('water_wave');
		expect(result).toContain('ocean');
		expect(result).not.toContain('water_wave');
	});

	it('matches aliases case insensitively', () => {
		expect(searchEmojiNames('WATER_WAVE')).toContain('ocean');
	});

	it('returns nothing for an unknown keyword', () => {
		expect(searchEmojiNames('notanemoji')).toEqual([]);
	});
});

describe('getEmojiAliases', () => {
	it('lists the other shortnames of an emoji', () => {
		expect(getEmojiAliases('ocean')).toContain('water_wave');
	});

	it('returns an empty list for an unknown name', () => {
		expect(getEmojiAliases('notanemoji')).toEqual([]);
	});
});
