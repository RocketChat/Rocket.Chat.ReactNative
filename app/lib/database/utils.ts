import XRegExp from 'xregexp';
import { slugify } from 'transliteration';

// Matches letters from any alphabet and numbers
const likeStringRegex = XRegExp('[^\\p{L}\\p{Nd}]', 'g');
export const sanitizeLikeString = (str?: string): string | undefined => str?.replace(likeStringRegex, '_');

// Will change any non-latin character to return a lower latin character string
// Example:
// slugifyLikeString('測試123') => 'ce-shi-123'
// slugifyLikeString('テスト123') => 'tesuto123'
export const slugifyLikeString = (str?: string) => {
	if (!str) return '';
	str?.replace(likeStringRegex, '_');
	const slugified = slugify(str);
	return slugified;
};

export const sanitizer = (r: object): object => r;
