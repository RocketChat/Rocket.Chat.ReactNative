import legacyShortnames from './legacyShortnames.json';

// The data lives in `legacyShortnames.json` — hand-maintained, safe to edit, and required as-is by
// `scripts/generate-emoji-data.js`.
//
// It holds shortnames older clients resolved that emojibase no longer lists. Message reactions and
// the frequently used emojis table store shortnames, so removing an entry makes stored ones render
// as literal `:shortname:` text. Only remove a name once nothing can hold it. See docs/emojis.md.
export const legacyShortnameToUnicodeMap: { [key: string]: string } = legacyShortnames;
