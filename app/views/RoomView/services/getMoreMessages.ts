import { MessageType, TMessageModel } from '../../../definitions';
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
	t: MessageType;
	tmid?: string;
	loaderItem: TMessageModel;
}): Promise<void> => {
	if ([MESSAGE_TYPE_LOAD_MORE, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK].includes(loaderItem.t as MessageType)) {
		return loadMessagesForRoom({
			rid,
			t,
			latest: loaderItem.ts,
			loaderItem
		});
	}

	if (loaderItem.t === MESSAGE_TYPE_LOAD_NEXT_CHUNK) {
		return loadNextMessages({
			rid,
			tmid,
			ts: loaderItem.ts,
			loaderItem
		});
	}
	return Promise.resolve();
};
export default getMoreMessages;
