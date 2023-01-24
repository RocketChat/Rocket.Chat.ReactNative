import { loadMessagesForRoom, loadMissedMessages } from '../../../lib/methods';

// TODO: clarify latest vs lastOpen
const getMessages = ({
	rid,
	t,
	latest,
	lastOpen,
	loaderItem
}: {
	rid: string;
	t?: string;
	latest?: Date;
	lastOpen?: Date;
	loaderItem?: any; // TODO: type this
}): Promise<void> => {
	if (lastOpen) {
		return loadMissedMessages({ rid, lastOpen });
	}
	return loadMessagesForRoom({ rid, t: t as any, latest, loaderItem });
};

export default getMessages;
