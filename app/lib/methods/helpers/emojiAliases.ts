import { aliasesByEmojiName, emojis } from '../../constants/emojis';

export const getEmojiAliases = (name: string): string[] => aliasesByEmojiName[name] ?? [];

export const searchEmojiNames = (keyword: string): string[] => {
	const term = keyword.toLowerCase();
	return emojis.filter(name => name.includes(term) || getEmojiAliases(name).some(alias => alias.includes(term)));
};
