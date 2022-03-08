import { SubscriptionType, TAnyMessageModel } from '../../../definitions';
import loadMessagesForRoom from '../../../lib/methods/loadMessagesForRoom';
import loadNextMessages from '../../../lib/methods/loadNextMessages';
import { MessageTypeLoad } from '../../../constants/messageTypeLoad';

const getMoreMessages = ({
	rid,
	t,
	tmid,
	loaderItem
}: {
	rid: string;
	t: SubscriptionType;
	tmid?: string;
	loaderItem: TAnyMessageModel;
}): Promise<void> => {
	if ([MessageTypeLoad.MORE, MessageTypeLoad.PREVIOUS_CHUNK].includes(loaderItem.t as MessageTypeLoad)) {
		return loadMessagesForRoom({
			rid,
			t: t as any,
			latest: loaderItem.ts as Date,
			loaderItem
		});
	}

	if (loaderItem.t === MessageTypeLoad.NEXT_CHUNK) {
		return loadNextMessages({
			rid,
			tmid,
			ts: loaderItem.ts as Date,
			loaderItem
		});
	}
	return Promise.resolve();
};
export default getMoreMessages;
