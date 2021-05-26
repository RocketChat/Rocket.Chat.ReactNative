import RocketChat from '../../../lib/rocketchat';

const getMessages = (room) => {
	if (room.lastOpen) {
		return RocketChat.loadMissedMessages(room);
	} else {
		return RocketChat.loadMessagesForRoom(room);
	}
};
export default getMessages;
