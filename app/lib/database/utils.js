import XRegExp from 'xregexp';

// Matches letters from any alphabet and numbers
const likeStringRegex = new XRegExp('[^\\p{L}\\p{Nd}]', 'g');
export const sanitizeLikeString = str => str?.replace(likeStringRegex, '_');

export const sanitizer = r => r;
