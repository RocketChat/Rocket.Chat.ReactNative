import emojis, { isEmojiShortname } from './emojis';
import ascii, { asciiRegexp, isAsciiEmoji } from './ascii';
import { useAppSelector } from '../useAppSelector';
import { getUserSelector } from '../../../selectors/login';

const shortnamePattern = new RegExp(/:[-+_a-z0-9]+:/, 'gi');
const replaceShortNameWithUnicode = (shortname: string) => (isEmojiShortname(shortname) ? emojis[shortname] : shortname);
const regAscii = new RegExp(`((\\s|^)${asciiRegexp}(?=\\s|$|[!,.?]))`, 'gi');

const htmlEntities = {
	'&amp;': '&',
	'&#38;': '&',
	'&#x26;': '&',
	'&lt;': '<',
	'&#60;': '<',
	'&#x3C;': '<',
	'&gt;': '>',
	'&#62;': '>',
	'&#x3E;': '>',
	'&quot;': '"',
	'&#34;': '"',
	'&#x22;': '"',
	'&apos;': "'",
	'&#39;': "'",
	'&#x27;': "'"
} satisfies Record<string, string>;

const isHtmlEntity = (entity: string): entity is keyof typeof htmlEntities => entity in htmlEntities;

const unescapeHTML = (string: string) =>
	string.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/gi, match =>
		isHtmlEntity(match) ? htmlEntities[match] : match
	);

const useShortnameToUnicode = (isEmojiPicker?: boolean) => {
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji);
	const formatShortnameToUnicode = (str: string) => {
		str = str.replace(shortnamePattern, replaceShortNameWithUnicode);
		str = str.replace(regAscii, (entire, _m1, m2, m3) => {
			const asciiEmoji = m3 ? unescapeHTML(m3) : m3;
			if (!asciiEmoji || !isAsciiEmoji(asciiEmoji)) {
				// if the ascii doesnt exist just return the entire match
				return entire;
			}

			if (!convertAsciiEmoji && !isEmojiPicker) {
				return m2 + asciiEmoji;
			}
			return m2 + ascii[asciiEmoji];
		});
		return str;
	};

	return {
		formatShortnameToUnicode
	};
};

export default useShortnameToUnicode;
