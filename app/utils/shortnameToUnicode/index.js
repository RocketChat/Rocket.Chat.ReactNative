import emojiMap from './data';
import asciiList from './asciiData';

const shortnames = Object.keys(emojiMap).join('|').replace(/\+/g, '\\+');
const shortnamePattern = new RegExp(shortnames, 'gi');
const replaceShortNameWithUnicode = shortname => emojiMap[shortname].unicode;
const asciiRegexp = '(\\*\\\\0\\/\\*|\\*\\\\O\\/\\*|\\-___\\-|\\:\'\\-\\)|\'\\:\\-\\)|\'\\:\\-D|\\>\\:\\-\\)|>\\:\\-\\)|\'\\:\\-\\(|\\>\\:\\-\\(|>\\:\\-\\(|\\:\'\\-\\(|O\\:\\-\\)|0\\:\\-3|0\\:\\-\\)|0;\\^\\)|O;\\-\\)|0;\\-\\)|O\\:\\-3|\\-__\\-|\\:\\-Þ|\\:\\-Þ|\\<\\/3|<\\/3|\\:\'\\)|\\:\\-D|\'\\:\\)|\'\\=\\)|\'\\:D|\'\\=D|\\>\\:\\)|>\\:\\)|\\>;\\)|>;\\)|\\>\\=\\)|>\\=\\)|;\\-\\)|\\*\\-\\)|;\\-\\]|;\\^\\)|\'\\:\\(|\'\\=\\(|\\:\\-\\*|\\:\\^\\*|\\>\\:P|>\\:P|X\\-P|\\>\\:\\[|>\\:\\[|\\:\\-\\(|\\:\\-\\[|\\>\\:\\(|>\\:\\(|\\:\'\\(|;\\-\\(|\\>\\.\\<|>\\.<|#\\-\\)|%\\-\\)|X\\-\\)|\\\\0\\/|\\\\O\\/|0\\:3|0\\:\\)|O\\:\\)|O\\=\\)|O\\:3|B\\-\\)|8\\-\\)|B\\-D|8\\-D|\\-_\\-|\\>\\:\\\\|>\\:\\\\|\\>\\:\\/|>\\:\\/|\\:\\-\\/|\\:\\-\\.|\\:\\-P|\\:Þ|\\:Þ|\\:\\-b|\\:\\-O|O_O|\\>\\:O|>\\:O|\\:\\-X|\\:\\-#|\\:\\-\\)|\\(y\\)|\\<3|<3|\\=D|;\\)|\\*\\)|;\\]|;D|\\:\\*|\\=\\*|\\:\\(|\\:\\[|\\=\\(|\\:@|;\\(|D\\:|\\:\\$|\\=\\$|#\\)|%\\)|X\\)|B\\)|8\\)|\\:\\/|\\:\\\\|\\=\\/|\\=\\\\|\\:L|\\=L|\\:P|\\=P|\\:b|\\:O|\\:X|\\:#|\\=X|\\=#|\\:\\)|\\=\\]|\\=\\)|\\:\\]|\\:D)';
const regAscii = new RegExp(`((\\s|^)${ asciiRegexp }(?=\\s|$|[!,.?]))`, 'gi');

const unescapeHTML = (string) => {
	const unescaped = {
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
		'&apos;': '\'',
		'&#39;': '\'',
		'&#x27;': '\''
	};

	return string.replace(/&(?:amp|#38|#x26|lt|#60|#x3C|gt|#62|#x3E|apos|#39|#x27|quot|#34|#x22);/ig, match => unescaped[match]);
};

const shortnameToUnicode = (str) => {
	str = str.replace(shortnamePattern, replaceShortNameWithUnicode);

	str = str.replace(regAscii, (entire, m1, m2, m3) => {
		if ((typeof m3 === 'undefined') || (m3 === '') || (!(unescapeHTML(m3) in asciiList))) {
			// if the ascii doesnt exist just return the entire match
			return entire;
		}

		m3 = unescapeHTML(m3);
		return asciiList[m3].unicode;
	});

	return str;
};

export default shortnameToUnicode;
