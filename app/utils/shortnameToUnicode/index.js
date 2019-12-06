import emojiMap from './data';

const shortnames = Object.keys(emojiMap).join('|').replace(/\+/g, '\\+');
const shortnamePattern = new RegExp(shortnames, 'gi');
const replaceShortNameWithUnicode = shortname => emojiMap[shortname].unicode;

const shortnameToUnicode = str => str.replace(shortnamePattern, replaceShortNameWithUnicode);

export default shortnameToUnicode;
