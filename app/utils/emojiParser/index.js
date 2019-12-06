// const emojiRegex = require('emoji-regex');

const emojiMap = require('./data');

const unicodeMap = Object.keys(emojiMap).reduce((prev, curr) => {
  const entry = emojiMap[curr];
  prev[entry.unicode] = { image: entry.image, shortname: curr };
  return prev;
}, {});

class EmojiShort {
  constructor (cdnUrl, klass = 'emojishort') {
    this.cdnUrl = cdnUrl;
    this.klass = klass;

    this.shortnames = Object.keys(emojiMap).join('|').replace(/\+/g, '\\+');
    this.shortnamePattern = new RegExp(this.shortnames, 'gi');

    this._replaceShortNameWithImgTag = this._replaceShortNameWithImgTag.bind(this);
    this._replaceShortNameWithUnicode = this._replaceShortNameWithUnicode.bind(this);
    this._replaceUnicodeWithImgTag = this._replaceUnicodeWithImgTag.bind(this);

    this.toImage = this.toImage.bind(this);
    this.toUnicode = this.toUnicode.bind(this);
    this.unicodeToImage = this.unicodeToImage.bind(this);
  }

  toImage (string) {
    return string.replace(this.shortnamePattern, this._replaceShortNameWithImgTag);
  }

  toUnicode (string) {
    return string.replace(this.shortnamePattern, this._replaceShortNameWithUnicode);
  }

  // unicodeToImage (string) {
  //   return string.replace(emojiRegex(), this._replaceUnicodeWithImgTag);
  // }

  _replaceShortNameWithImgTag (shortname) {
    const emoji = emojiMap[shortname];
    if (!emoji) return shortname;
    return `<img class="${this.klass}" src="${this.cdnUrl}${emoji.image}" alt="${shortname}" title="${shortname}" />`;
  }

  _replaceShortNameWithUnicode (shortname) {
    return emojiMap[shortname].unicode;
  }

  _replaceUnicodeWithImgTag (unicode) {
    const emoji = unicodeMap[unicode];
    if (!emoji) return unicode;
    return `<img class="${this.klass}" src="${this.cdnUrl}${emoji.image}" alt="${emoji.shortname}" title="${emoji.shortname}" />`;
  }
}

const emoji = new EmojiShort();
export default emoji;
