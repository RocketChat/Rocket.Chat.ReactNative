import RocketChat from '../../../lib/rocketchat';

// TODO - after merge navigation ts, change the room and the promisse return
const getMessages = (room: any): Promise<any> => {
	if (room.lastOpen) {
		return RocketChat.loadMissedMessages(room);
	}
	return RocketChat.loadMessagesForRoom(room);
};
export default getMessages;
