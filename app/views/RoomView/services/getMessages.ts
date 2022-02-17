import { TSubscriptionModel } from '../../../definitions';
import loadMessagesForRoom from '../../../lib/methods/loadMessagesForRoom';
import loadMissedMessages from '../../../lib/methods/loadMissedMessages';

const getMessages = (room: TSubscriptionModel) => {
	if (room.lastOpen) {
		return loadMissedMessages(room);
	}
	return loadMessagesForRoom(room);
};
export default getMessages;
