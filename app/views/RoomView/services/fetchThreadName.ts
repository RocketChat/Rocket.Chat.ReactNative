import I18n from '../../../i18n';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';

export const fetchThreadName = async (
	rid: string,
	threadId: string,
	messageId: string,
	knownName?: string
): Promise<string | undefined> => {
	const threadRecord = await getThreadById(threadId);
	if (threadRecord?.t === 'rm') {
		return I18n.t('Message_removed');
	}
	if (knownName) {
		return knownName;
	}
	return getThreadName(rid, threadId, messageId);
};
