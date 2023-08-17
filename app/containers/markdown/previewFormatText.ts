import removeMarkdown from 'remove-markdown';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { formatText } from './formatText';
import { formatHyperlink } from './formatHyperlink';

export const previewFormatText = (msg: string) => {
	let m = formatText(msg);
	m = formatHyperlink(m);
	m = shortnameToUnicode(m);
	// Removes sequential empty spaces
	// TODO: undoes https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/5064/files#diff-acf5acde58285628166dc989f5f1b1f4b7a4a928f0a46d2b0405045eb01aaf26L30-L31
	m = m.replace(/\s+/g, ' ');
	m = removeMarkdown(m);
	m = m.replace(/\n+/g, ' ');
	return m;
};
