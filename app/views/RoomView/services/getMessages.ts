import RocketChat from '../../../lib/rocketchat';
import { IRoom } from '../../../definitions/IRoom';

const getMessages = (room: IRoom): Promise<void> => {
	if (room.lastOpen) {
		return RocketChat.loadMissedMessages(room);
	}
	return RocketChat.loadMessagesForRoom(room);
};
export default getMessages;
