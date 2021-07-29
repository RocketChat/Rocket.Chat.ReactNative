import XRegExp from 'xregexp';
import slug from 'slug';

// Matches letters from any alphabet and numbers
const likeStringRegex = new XRegExp('[^\\p{L}\\p{Nd}]', 'g');
export const sanitizeLikeString = str => str?.replace(likeStringRegex, '_');

export const slugifyLikeString = (str) => {
    str?.replace(likeStringRegex, '_');
    const slugified = slug(str);
    return slugified;
};

export const sanitizer = r => r;
