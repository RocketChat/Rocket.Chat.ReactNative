import { MESSAGE_TYPE_LOAD_MORE, MESSAGE_TYPE_LOAD_NEXT_CHUNK, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK } from '../../../constants/messageTypeLoad';
import RocketChat from '../../../lib/rocketchat';

const getMoreMessages = ({
	rid, t, tmid, loaderItem
}) => {
	if ([MESSAGE_TYPE_LOAD_MORE, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK].includes(loaderItem.t)) {
		return RocketChat.loadMessagesForRoom({
			rid, t, latest: loaderItem.ts, loaderItem
		});
	}

	if (loaderItem.t === MESSAGE_TYPE_LOAD_NEXT_CHUNK) {
		return RocketChat.loadNextMessages({
			rid, tmid, ts: loaderItem.ts, loaderItem
		});
	}
};
export default getMoreMessages;
