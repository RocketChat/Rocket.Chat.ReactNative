import { MessageType, SubscriptionType, TAnyMessageModel } from '../../../definitions';
import loadMessagesForRoom from '../../../lib/methods/loadMessagesForRoom';
import loadNextMessages from '../../../lib/methods/loadNextMessages';
import {
	MESSAGE_TYPE_LOAD_MORE,
	MESSAGE_TYPE_LOAD_NEXT_CHUNK,
	MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK
} from '../../../constants/messageTypeLoad';

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
	if ([MESSAGE_TYPE_LOAD_MORE, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK].includes(loaderItem.t as MessageType)) {
		return loadMessagesForRoom({
			rid,
			t: t as any,
			latest: loaderItem.ts as Date,
			loaderItem
		});
	}

	if (loaderItem.t === MESSAGE_TYPE_LOAD_NEXT_CHUNK) {
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
