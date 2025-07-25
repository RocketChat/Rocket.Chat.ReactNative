import { getPermalinkMessage } from '../../../lib/methods';
import { getMessageById } from '../../../lib/database/services/Message';
import { store } from '../../../lib/store/auxStore';
import { compareServerVersion } from '../../../lib/methods/helpers';

export const prepareQuoteMessage = async (textFromInput: string, selectedMessages: string[]): Promise<string> => {
	let quoteText = '';
	const { version: serverVersion } = store.getState().server;
	const connectionString = compareServerVersion(serverVersion, 'lowerThan', '5.0.0') ? ' ' : '\n';

	if (selectedMessages.length > 0) {
		for (let i = 0; i < selectedMessages.length; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			const message = await getMessageById(selectedMessages[i]);
			if (message) {
				// eslint-disable-next-line no-await-in-loop
				const permalink = await getPermalinkMessage(message);
				quoteText += `[ ](${permalink}) ${connectionString}`;
			}
		}
	}
	quoteText = `${quoteText}${textFromInput}`;
	return quoteText;
};
