import { Q } from './facade';
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

// Builds the WHERE clause used to search subscriptions by name/fname.
// Querying the slugified `sanitized_fname`/`name` columns makes the search case-insensitive
// for non-latin alphabets (e.g. Cyrillic), where SQLite's LIKE is case-sensitive.
export const getSubscriptionSearchClause = (searchText: string): Q.Or => {
	const likeString = sanitizeLikeString(searchText);
	const slugifiedString = slugifyLikeString(searchText);
	return Q.or(
		// `sanitized_fname` is an optional column, so it's going to start null and it's going to get filled over time
		Q.where('sanitized_fname', Q.like(`%${slugifiedString}%`)),
		// the param 'name' is slugified by the server when the slugify setting is enabled, just for channels and teams
		Q.where('name', Q.like(`%${slugifiedString}%`)),
		// Still need the conditionals below because at the first moment the sanitized_fname won't be filled
		Q.where('name', Q.like(`%${likeString}%`)),
		Q.where('fname', Q.like(`%${likeString}%`))
	);
};

export const sanitizer = (r: object): object => r;
