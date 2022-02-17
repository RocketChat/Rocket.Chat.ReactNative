import XRegExp from 'xregexp';

// Matches letters from any alphabet and numbers
const likeStringRegex = XRegExp('[^\\p{L}\\p{Nd}]', 'g');
export const sanitizeLikeString = (str?: string): string | undefined => str?.replace(likeStringRegex, '_');

export const sanitizer = (r: object): object => r;
