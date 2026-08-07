import { formatChannelMentions } from './formatChannelMentions';

describe('formatChannelMentions', () => {
	it('replaces a discussion mention with its fname', () => {
		expect(formatChannelMentions('see #aBcD123xyz', [{ name: 'aBcD123xyz', fname: 'My Discussion' }])).toBe('see #My Discussion');
	});

	it('keeps the raw name when the channel has no fname', () => {
		expect(formatChannelMentions('see #general', [{ name: 'general' }])).toBe('see #general');
	});

	it('leaves hashtags that are not in channels untouched', () => {
		expect(formatChannelMentions('see #unknown', [{ name: 'general', fname: 'General' }])).toBe('see #unknown');
	});

	it('returns the message unchanged when there are no channels', () => {
		expect(formatChannelMentions('see #aBcD123xyz', [])).toBe('see #aBcD123xyz');
		expect(formatChannelMentions('see #aBcD123xyz', undefined)).toBe('see #aBcD123xyz');
	});

	it('replaces every occurrence of the same mention', () => {
		expect(formatChannelMentions('#id1 then #id1', [{ name: 'id1', fname: 'Design' }])).toBe('#Design then #Design');
	});

	it('replaces several different mentions in one message', () => {
		expect(
			formatChannelMentions('#id1 and #id2', [
				{ name: 'id1', fname: 'Design' },
				{ name: 'id2', fname: 'Product' }
			])
		).toBe('#Design and #Product');
	});

	// A naive replaceAll on the shorter name first would corrupt the longer mention
	it('does not corrupt a longer mention that starts with a shorter channel name', () => {
		expect(
			formatChannelMentions('#abc and #abcdef', [
				{ name: 'abc', fname: 'Short' },
				{ name: 'abcdef', fname: 'Long' }
			])
		).toBe('#Short and #Long');
	});

	it('does not match a channel name that is only a prefix of the written mention', () => {
		expect(formatChannelMentions('#abcdef', [{ name: 'abc', fname: 'Short' }])).toBe('#abcdef');
	});

	it('handles names containing regex metacharacters', () => {
		expect(formatChannelMentions('#a.b-c_d', [{ name: 'a.b-c_d', fname: 'Dotted' }])).toBe('#Dotted');
	});

	it('still replaces a mention followed by sentence punctuation', () => {
		expect(formatChannelMentions('go to #id1.', [{ name: 'id1', fname: 'Design' }])).toBe('go to #Design.');
	});

	it('prefers the longer channel name when one is a dotted extension of another', () => {
		expect(
			formatChannelMentions('#a.b', [
				{ name: 'a', fname: 'Short' },
				{ name: 'a.b', fname: 'Long' }
			])
		).toBe('#Long');
	});

	// Accessibility labels announce the name alone, without the sigil
	it('drops the sigil for a discussion mention with an fname', () => {
		expect(formatChannelMentions('see #aBcD123xyz', [{ name: 'aBcD123xyz', fname: 'My Discussion' }], true)).toBe(
			'see My Discussion'
		);
	});

	it('drops the sigil for a channel without an fname', () => {
		expect(formatChannelMentions('see #general', [{ name: 'general' }], true)).toBe('see general');
	});

	it('returns an empty string unchanged', () => {
		expect(formatChannelMentions('', [{ name: 'id1', fname: 'Design' }])).toBe('');
	});
});
