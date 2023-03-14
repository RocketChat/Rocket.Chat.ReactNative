import XRegExp from 'xregexp';
import slug from 'slug';

// Matches letters from any alphabet and numbers
const likeStringRegex = XRegExp('[^\\p{L}\\p{Nd}]', 'g');
export const sanitizeLikeString = (str?: string): string | undefined => str?.replace(likeStringRegex, '_');

export const slugifyLikeString = (str: string) => {
	str?.replace(likeStringRegex, '_');
	const slugified = slug(str);
	return slugified;
};

export const sanitizer = (r: object): object => r;
