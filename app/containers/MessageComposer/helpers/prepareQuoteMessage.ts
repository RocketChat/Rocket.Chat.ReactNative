import { getPermalinkMessage } from '~/lib/methods/getPermalinks';
import { getMessageById } from '~/lib/database/services/Message';
import { store } from '~/lib/store/auxStore';
import { compareServerVersion } from '~/lib/methods/helpers';

export const prepareQuoteMessage = async (textFromInput: string, selectedMessages: string[], tmid?: string): Promise<string> => {
	const { version: serverVersion } = store.getState().server;
	const connectionString = compareServerVersion(serverVersion, 'lowerThan', '5.0.0') ? ' ' : '\n';

	const permalinks = await Promise.all(
		selectedMessages.map(async messageId => {
			const message = await getMessageById(messageId, tmid);
			return message ? getPermalinkMessage(message) : undefined;
		})
	);
	const quoteText = permalinks
		.filter(permalink => permalink !== undefined)
		.map(permalink => `[ ](${permalink}) ${connectionString}`)
		.join('');
	return `${quoteText}${textFromInput}`;
};
