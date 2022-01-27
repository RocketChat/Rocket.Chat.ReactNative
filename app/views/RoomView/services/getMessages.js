import RocketChat from '../../../lib/rocketchat/services/rocketchat';

const getMessages = room => {
	if (room.lastOpen) {
		return RocketChat.loadMissedMessages(room);
	} else {
		return RocketChat.loadMessagesForRoom(room);
	}
};
export default getMessages;
