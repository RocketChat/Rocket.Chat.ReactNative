import emojis from './emojis';
import ascii, { asciiRegexp } from './ascii';
import { useAppSelector } from '../useAppSelector';
import { getUserSelector } from '../../../selectors/login';

const shortnamePattern = new RegExp(/:[-+_a-z0-9]+:/, 'gi');
const replaceShortNameWithUnicode = (shortname: string) => emojis[shortname] || shortname;
const regAscii = new RegExp(`((\\s|^)${asciiRegexp}(?=\\s|$|[!,.?]))`, 'gi');

const unescapeHTML = (string: string) => {
	const unescaped: { [key: string]: string } = {
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
	};

	return string.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/gi, match => unescaped[match]);
};

const useShortnameToUnicode = (isEmojiPicker?: boolean) => {
	const convertAsciiEmoji = useAppSelector(state => getUserSelector(state)?.settings?.preferences?.convertAsciiEmoji);
	const formatShortnameToUnicode = (str: string) => {
		str = str.replace(shortnamePattern, replaceShortNameWithUnicode);
		str = str.replace(regAscii, (entire, m1, m2, m3) => {
			if (!m3 || !(unescapeHTML(m3) in ascii)) {
				// if the ascii doesnt exist just return the entire match
				return entire;
			}

			m3 = unescapeHTML(m3);

			if (!convertAsciiEmoji && !isEmojiPicker) {
				return m3;
			}
			return ascii[m3];
		});
		return str;
	};

	return {
		formatShortnameToUnicode
	};
};

export default useShortnameToUnicode;
