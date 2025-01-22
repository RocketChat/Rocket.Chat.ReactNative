import removeMarkdown from 'remove-markdown';

import shortnameToUnicode from '../methods/helpers/shortnameToUnicode';
import { formatText } from './formatText';
import { formatHyperlink } from './formatHyperlink';

export const previewFormatText = (msg: string) => {
	let m = formatText(msg);
	m = formatHyperlink(m);
	m = shortnameToUnicode(m);
	// Removes sequential empty spaces before to use removeMarkdown,
	// because with some edge cases the library takes a long time to finish the process
	m = m.replace(/\s+/g, ' ');
	m = removeMarkdown(m);
	// Removes sequential empty spaces to remove leading empty space on quotes at the rooms list view
	m = m.replace(/\s+/g, ' ');
	m = m.replace(/\n+/g, ' ');
	return m;
};
