import removeMarkdown from 'remove-markdown';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { formatText } from './formatText';
import { formatHyperlink } from './formatHyperlink';

export const previewFormatText = (msg: string) => {
	let m = formatText(msg);
	m = formatHyperlink(m);
	m = shortnameToUnicode(m);
	m = removeMarkdown(m);
	// Removes sequential empty spaces
	m = m.replace(/\s+/g, ' ');
	m = m.replace(/\n+/g, ' ');
	return m;
};
