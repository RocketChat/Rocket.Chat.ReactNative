import { SubscriptionType, TAnyMessageModel } from '../../definitions';
import { loadNextMessages, loadMessagesForRoom } from '.';
import { MessageTypeLoad } from '../constants';

const getMoreMessages = ({
	rid,
	t,
	loaderItem
}: {
	rid: string;
	t: SubscriptionType;
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
			ts: loaderItem.ts as Date,
			loaderItem
		});
	}
	return Promise.resolve();
};

export default getMoreMessages;
