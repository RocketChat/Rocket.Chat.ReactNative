import { MessageTypeLoad } from '../../../constants/messageTypeLoad';
import RocketChat from '../../../lib/rocketchat';

const getMoreMessages = ({ rid, t, tmid, loaderItem }) => {
	if ([MessageTypeLoad.MORE, MessageTypeLoad.PREVIOUS_CHUNK].includes(loaderItem.t)) {
		return RocketChat.loadMessagesForRoom({
			rid,
			t,
			latest: loaderItem.ts,
			loaderItem
		});
	}

	if (loaderItem.t === MessageTypeLoad.NEXT_CHUNK) {
		return RocketChat.loadNextMessages({
			rid,
			tmid,
			ts: loaderItem.ts,
			loaderItem
		});
	}
};
export default getMoreMessages;
