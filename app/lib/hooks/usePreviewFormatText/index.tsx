import removeMarkdown from 'remove-markdown';

import useShortnameToUnicode from '../useShortnameToUnicode';
import { formatText } from '../../helpers/formatText';
import { formatHyperlink } from '../../helpers/formatHyperlink';
import { formatChannelMentions, type TMentionableChannel } from '../../methods/helpers/formatChannelMentions';

const usePreviewFormatText = (msg: string, channels?: TMentionableChannel[]) => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();

	// Resolved before the markdown is stripped, so the mention is still `#name` at this point
	let m = formatChannelMentions(msg, channels);
	m = formatText(m);
	m = formatHyperlink(m);
	m = formatShortnameToUnicode(m);
	// Removes sequential empty spaces before to use removeMarkdown,
	// because with some edge cases the library takes a long time to finish the process
	m = m.replace(/\s+/g, ' ');
	m = removeMarkdown(m);
	// Removes sequential empty spaces to remove leading empty space on quotes at the rooms list view
	m = m.replace(/\s+/g, ' ');
	m = m.replace(/\n+/g, ' ');
	return m;
};

export default usePreviewFormatText;
