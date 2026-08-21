// The picker lists one shortname per emoji, so searching matches every alias but returns the listed name.
import shortnameToUnicodeMap from '../../hooks/useShortnameToUnicode/emojis';
import { emojis } from '../../constants/emojis';

const bare = (unicode: string) => unicode.replace(/️/g, '');

let aliasesByEmojiName: Record<string, string[]> | null = null;

const buildAliasIndex = () => {
	const nameByUnicode: Record<string, string> = {};
	emojis.forEach(name => {
		const unicode = shortnameToUnicodeMap[`:${name}:`];
		if (unicode && !(bare(unicode) in nameByUnicode)) {
			nameByUnicode[bare(unicode)] = name;
		}
	});

	const index: Record<string, string[]> = {};
	Object.keys(shortnameToUnicodeMap).forEach(shortname => {
		const name = nameByUnicode[bare(shortnameToUnicodeMap[shortname])];
		const alias = shortname.slice(1, -1);
		if (!name || alias === name) {
			return;
		}
		if (!index[name]) {
			index[name] = [];
		}
		index[name].push(alias);
	});

	return index;
};

export const getEmojiAliases = (name: string): string[] => {
	if (!aliasesByEmojiName) {
		aliasesByEmojiName = buildAliasIndex();
	}
	return aliasesByEmojiName[name] ?? [];
};

export const searchEmojiNames = (keyword: string): string[] => {
	const term = keyword.toLowerCase();
	return emojis.filter(name => name.includes(term) || getEmojiAliases(name).some(alias => alias.includes(term)));
};
