import { loadMessagesForRoom, loadMissedMessages } from '../../../lib/methods';

const getMessages = ({ rid, t, lastOpen }: { rid: string; t?: string; lastOpen?: Date }): Promise<void> => {
	if (lastOpen) {
		return loadMissedMessages({ rid, lastOpen });
	}
	return loadMessagesForRoom({ rid, t: t as any });
};

export default getMessages;
